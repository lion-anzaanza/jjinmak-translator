const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

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

// 속마음 문구 목록 (server/phrases.json에서 관리)
const phrases = JSON.parse(fs.readFileSync(path.join(__dirname, 'phrases.json'), 'utf-8'));

// 금지어 목록 (server/bannedWords.json에서 관리)
const bannedWords = JSON.parse(fs.readFileSync(path.join(__dirname, 'bannedWords.json'), 'utf-8'));

// API: 속마음 번역하기
app.post('/api/translate', (req, res) => {
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
    }
  }

  res.json({ name: trimmedName, phrase, playCount, totalPhrases: phrases.length });
});

// API: 랭킹 조회 (TOP 6)
app.get('/api/ranking', (req, res) => {
  const rows = db.prepare('SELECT name, play_count FROM players ORDER BY play_count DESC LIMIT 6').all();
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

app.listen(PORT, () => {
  console.log(`서버 실행 중: http://localhost:${PORT}`);
});
