const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 5000;

// Nginx 프록시 뒤에서 실제 클라이언트 IP 사용
app.set('trust proxy', '172.17.0.0/16');

// Middleware
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());

// 매크로 감지 (CV → 메타CV → 메타메타CV 3단계 분석)
const requestHistory = new Map(); // IP → [timestamp, ...]
const cvHistory = new Map(); // IP → [cv값, ...]
const metaCVHistory = new Map(); // IP → [metaCV값, ...]
const macroBlocked = new Map(); // IP → 차단 해제 시각
const macroStrikes = new Map(); // IP → 누적 적발 횟수
const bannedIPsPath = path.join(__dirname, 'bannedIPs.json');
const bannedIPsData = loadJSON(bannedIPsPath);
// 하위 호환: 배열이 문자열이면 Set, 객체면 Map
const macroBanned = new Map(
  bannedIPsData.map(entry => typeof entry === 'string' ? [entry, '(알 수 없음)'] : [entry.ip, entry.name])
);
const SAMPLE_SIZE = 50;
const CV_THRESHOLD = 3; // 변동계수 3% 미만이면 매크로
const META_CV_THRESHOLD = 2; // CV값의 변동계수 2% 미만이면 패턴 반복 매크로
const META_META_CV_THRESHOLD = 2; // 메타CV의 변동계수 2% 미만이면 패턴 변경 매크로
const META_SAMPLE_SIZE = 50; // 메타CV 표본 수
const META_META_SAMPLE_SIZE = 50; // 메타메타CV 표본 수
const BLOCK_DURATION = 60 * 1000; // 1분 차단

function calcCV(values) {
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, v) => sum + (v - avg) ** 2, 0) / values.length;
  return avg > 0 ? (Math.sqrt(variance) / avg) * 100 : 0;
}

function detectMacro(ip, name) {
  // 영구 차단 확인
  if (macroBanned.has(ip)) return { blocked: true, message: '니는 내 웬수다!!! 절교데이!!!' };

  // 일시 차단 중인지 확인
  const blockedUntil = macroBlocked.get(ip);
  if (blockedUntil && Date.now() < blockedUntil) return { blocked: true, message: '매크로가 감지됐데이! 어찌 이럴 수가 있노! 니는 1분 동안 내 웬수다! 반성하고 오그레이!' };
  if (blockedUntil) macroBlocked.delete(ip);

  const now = Date.now();
  const history = requestHistory.get(ip) || [];
  history.push(now);

  if (history.length > SAMPLE_SIZE) history.shift();
  requestHistory.set(ip, history);

  if (history.length < SAMPLE_SIZE) return false;

  // 간격 변동계수 계산
  const intervals = [];
  for (let i = 1; i < history.length; i++) {
    intervals.push(history[i] - history[i - 1]);
  }
  const cv = calcCV(intervals);

  // CV 히스토리 추적
  const cvHist = cvHistory.get(ip) || [];
  cvHist.push(cv);
  if (cvHist.length > META_SAMPLE_SIZE) cvHist.shift();
  cvHistory.set(ip, cvHist);

  // 메타 CV (변동계수의 변동계수) 계산
  const metaCV = cvHist.length >= META_SAMPLE_SIZE ? calcCV(cvHist) : null;

  // 메타메타 CV (메타CV의 변동계수) 계산
  const metaCVHist = metaCVHistory.get(ip) || [];
  if (metaCV !== null) {
    metaCVHist.push(metaCV);
    if (metaCVHist.length > META_META_SAMPLE_SIZE) metaCVHist.shift();
    metaCVHistory.set(ip, metaCVHist);
  }
  const metaMetaCV = metaCVHist.length >= META_META_SAMPLE_SIZE ? calcCV(metaCVHist) : null;

  const metaCVStr = metaCV !== null ? metaCV.toFixed(1) + '%' : '-';
  const metaMetaCVStr = metaMetaCV !== null ? metaMetaCV.toFixed(1) + '%' : '-';

  console.log(`[패턴] ${name} | CV: ${cv.toFixed(1)}% | 메타CV: ${metaCVStr} | 메타메타CV: ${metaMetaCVStr} | IP: ${ip}`);

  // 매크로 판정
  let isMacro = false;
  let reason = '';

  // 전과자는 기준 강화 (2% → 5%)
  const strikes = macroStrikes.get(ip) || 0;
  const metaThreshold = strikes > 0 ? 5 : META_CV_THRESHOLD;
  const metaMetaThreshold = strikes > 0 ? 5 : META_META_CV_THRESHOLD;

  if (cv < CV_THRESHOLD) {
    isMacro = true;
    reason = '균일 간격 매크로';
  } else if (metaCV !== null && metaCV < metaThreshold) {
    isMacro = true;
    reason = `패턴 반복 매크로 (메타CV: ${metaCV.toFixed(1)}%, 기준: ${metaThreshold}%)`;
  } else if (metaMetaCV !== null && metaMetaCV < metaMetaThreshold) {
    isMacro = true;
    reason = `패턴 변경 매크로 (메타메타CV: ${metaMetaCV.toFixed(1)}%, 기준: ${metaMetaThreshold}%)`;
  }

  if (isMacro) {
    const strikes = (macroStrikes.get(ip) || 0) + 1;
    macroStrikes.set(ip, strikes);
    requestHistory.delete(ip);
    cvHistory.delete(ip);
    metaCVHistory.delete(ip);

    if (strikes >= 5) {
      macroBanned.set(ip, name);
      const bannedList = [...macroBanned].map(([ip, name]) => ({ ip, name }));
      fs.promises.writeFile(bannedIPsPath, JSON.stringify(bannedList, null, 2)).catch(e => console.error('bannedIPs 저장 실패:', e.message));
      console.log(`[영구차단] ${name} | ${reason} | ${strikes}회 적발 | IP: ${ip}`);
      return { blocked: true, message: '니는 내 웬수다!!! 절교데이!!!' };
    } else if (strikes >= 3) {
      macroBlocked.set(ip, Date.now() + BLOCK_DURATION);
      console.log(`[경고] ${name} | ${reason} | ${strikes}회 적발 | IP: ${ip}`);
      return { blocked: true, message: '내는 경고했데이!! 웬수 되고 싶나!!!' };
    } else {
      macroBlocked.set(ip, Date.now() + BLOCK_DURATION);
      console.log(`[차단] ${name} | ${reason} | ${strikes}회 적발 | 1분 차단 | IP: ${ip}`);
      return { blocked: true, message: '매크로가 감지됐데이! 어찌 이럴 수가 있노! 니는 1분 동안 내 웬수다! 반성하고 오그레이!' };
    }
  }

  return { blocked: false };
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
  // 브라우저 헤더 검증 (허용 도메인 화이트리스트)
  const ALLOWED_ORIGINS = [
    'https://jjinmak.anzaanza.cloud',
    'https://anzaanza.cloud',
    'http://localhost:3000',
  ];
  const origin = req.get('origin') || req.get('referer') || '';
  if (!ALLOWED_ORIGINS.some(o => origin.startsWith(o))) {
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

  if (trimmedName.length > 5) {
    return res.status(400).json({ error: '이름은 5글자 이하만 가능하데이!' });
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
  const macro = detectMacro(req.ip, trimmedName);
  if (macro.blocked) {
    return res.status(429).json({ error: macro.message });
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

// 1시간마다 매크로 감지 메모리 정리
setInterval(() => {
  const now = Date.now();
  for (const [ip, until] of macroBlocked) {
    if (now >= until) macroBlocked.delete(ip);
  }
  for (const ip of macroStrikes.keys()) {
    if (macroBanned.has(ip)) macroStrikes.delete(ip);
  }
  // 1시간 이상 요청 없는 IP의 히스토리 정리
  for (const ip of requestHistory.keys()) {
    const hist = requestHistory.get(ip);
    if (hist.length > 0 && now - hist[hist.length - 1] > 3600000) {
      requestHistory.delete(ip);
      cvHistory.delete(ip);
      metaCVHistory.delete(ip);
    }
  }
}, 3600000);

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
