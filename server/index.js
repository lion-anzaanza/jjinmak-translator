const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 5000;

// Nginx 프록시 뒤에서 실제 클라이언트 IP 사용
app.set('trust proxy', true);

// Middleware
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());

// 매크로 감지 (30건 기준 요청 간격 변동계수 분석)
const requestHistory = new Map(); // IP → [timestamp, ...]
const macroBlocked = new Map(); // IP → 차단 해제 시각
const SAMPLE_SIZE = 30;
const CV_THRESHOLD = 3; // 변동계수 3% 미만이면 매크로
const BLOCK_DURATION = 60 * 1000; // 1분 차단

function detectMacro(ip, name) {
  // 차단 중인지 확인
  const blockedUntil = macroBlocked.get(ip);
  if (blockedUntil && Date.now() < blockedUntil) return true;
  if (blockedUntil) macroBlocked.delete(ip);
  const now = Date.now();
  const history = requestHistory.get(ip) || [];
  history.push(now);

  if (history.length > SAMPLE_SIZE) history.shift();
  requestHistory.set(ip, history);

  if (history.length < SAMPLE_SIZE) return false;

  const intervals = [];
  for (let i = 1; i < history.length; i++) {
    intervals.push(history[i] - history[i - 1]);
  }

  const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length;
  const variance = intervals.reduce((sum, v) => sum + (v - avg) ** 2, 0) / intervals.length;
  const stdev = Math.sqrt(variance);
  const cv = avg > 0 ? (stdev / avg) * 100 : 0;

  console.log(`[패턴] ${name} | 평균: ${avg.toFixed(0)}ms | 표준편차: ${stdev.toFixed(1)}ms | 변동계수: ${cv.toFixed(1)}% | IP: ${ip}`);

  if (cv < CV_THRESHOLD) {
    macroBlocked.set(ip, Date.now() + BLOCK_DURATION);
    requestHistory.delete(ip);
    console.log(`[차단] ${name} | 1분 차단 | IP: ${ip}`);
    return true;
  }
  return false;
}

// 번역 API Rate Limit (IP당 초당 20회)
const translateLimiter = rateLimit({
  windowMs: 1000,
  max: 20,
  message: { error: '너무 빨리 누르고 있데이! 고마 진정해래이!' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Database 초기화
const dbDir = path.join(__dirname, 'db');
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });
const db = new Database(path.join(dbDir, 'jjinmak.db'));
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS players (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    play_count INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// JSON 파일 안전 로드
function loadJSON(filepath) {
  try {
    return JSON.parse(fs.readFileSync(filepath, 'utf-8'));
  } catch (e) {
    console.error(`${filepath} 로드 실패:`, e.message);
    process.exit(1);
  }
}

const phrases = loadJSON(path.join(__dirname, 'phrases.json'));

// 신규 플레이어 일자별 로깅
function logNewPlayer(name) {
  const logsDir = path.join(__dirname, 'db', 'logs');
  if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });

  const today = new Date().toISOString().slice(0, 10);
  const logFile = path.join(logsDir, `${today}.json`);
  const now = new Date().toISOString().slice(11, 19);

  let entries = [];
  if (fs.existsSync(logFile)) {
    entries = JSON.parse(fs.readFileSync(logFile, 'utf-8'));
  }
  entries.push({ name, time: now });
  fs.writeFileSync(logFile, JSON.stringify(entries, null, 2));
}

// 금지어 목록 (server/bannedWords.json에서 관리)
const bannedWords = loadJSON(path.join(__dirname, 'bannedWords.json'));

// API: 속마음 번역하기
app.post('/api/translate', translateLimiter, (req, res) => {
  // 브라우저 헤더 검증 (스크립트/매크로 차단)
  const origin = req.get('origin') || req.get('referer') || '';
  if (!origin) {
    return res.status(403).json({ error: '잘못된 접근입니다.' });
  }

  const { name, skipRanking } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: '이름을 입력해주세요.' });
  }

  const trimmedName = name.trim();

  if (!/^[가-힣]+$/.test(trimmedName)) {
    return res.status(400).json({ error: '한글 이름만 입력할 수 있습니다.' });
  }

  if (bannedWords.some(word => trimmedName.includes(word))) {
    return res.status(400).json({ error: '사용할 수 없는 이름입니다.' });
  }

  const phrase = phrases[Math.floor(Math.random() * phrases.length)];

  let playCount = 1;

  if (!skipRanking) {
    const existing = db.prepare('SELECT * FROM players WHERE name = ?').get(trimmedName);

    if (existing) {
      db.prepare('UPDATE players SET play_count = play_count + 1, updated_at = CURRENT_TIMESTAMP WHERE name = ?').run(trimmedName);
      playCount = existing.play_count + 1;
    } else {
      db.prepare('INSERT INTO players (name) VALUES (?)').run(trimmedName);
      logNewPlayer(trimmedName);
    }
  }

  // 매크로 감지
  if (detectMacro(req.ip, trimmedName)) {
    return res.status(429).json({ error: '매크로가 감지됐데이! 어찌 이럴 수가 있노! 니는 1분 동안 내 웬수다! 반성하고 오그레이!' });
  }

  res.json({ name: trimmedName, phrase, playCount, totalPhrases: phrases.length });
});

// API: 랭킹 조회 (TOP 6)
app.get('/api/ranking', (req, res) => {
  const rows = db.prepare('SELECT name, play_count FROM players ORDER BY play_count DESC LIMIT 20').all();
  res.json({ ranking: rows });
});

// API: 이름 검색 (순위 + 플레이 횟수)
app.get('/api/search', (req, res) => {
  const name = req.query.name || '';
  if (!name.trim()) return res.json({ result: null });

  const player = db.prepare('SELECT name, play_count FROM players WHERE name = ?').get(name.trim());
  if (!player) return res.json({ result: null });

  const rank = db.prepare('SELECT COUNT(*) as rank FROM players WHERE play_count > ?').get(player.play_count).rank + 1;
  res.json({ result: { ...player, rank } });
});

// 프로덕션: React 빌드 파일 서빙
if (process.env.NODE_ENV === 'production') {
  const publicPath = path.join(__dirname, 'public');
  app.use(express.static(publicPath));
  app.get('/{*path}', (req, res) => {
    res.sendFile(path.join(publicPath, 'index.html'));
  });
}

// 매주 월요일 KST 00:00 랭킹 초기화
function resetRanking() {
  db.exec('DELETE FROM players');
  console.log(`[${new Date().toISOString()}] 랭킹 초기화 완료`);
}

function msUntilNextMondayKST() {
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
  const daysUntilMonday = (8 - now.getDay()) % 7 || 7;
  const nextMonday = new Date(now);
  nextMonday.setDate(now.getDate() + daysUntilMonday);
  nextMonday.setHours(0, 0, 0, 0);
  return nextMonday.getTime() - now.getTime();
}

const ONE_WEEK = 7 * 24 * 60 * 60 * 1000;
setTimeout(() => {
  resetRanking();
  setInterval(resetRanking, ONE_WEEK);
}, msUntilNextMondayKST());

app.listen(PORT, () => {
  console.log(`서버 실행 중: http://localhost:${PORT}`);
  console.log(`다음 랭킹 초기화: ${Math.round(msUntilNextMondayKST() / 1000 / 60 / 60)}시간 후`);
});
