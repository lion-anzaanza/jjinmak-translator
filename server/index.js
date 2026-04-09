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

// 속마음 문구 목록
const phrases = [
  '이걸 더 안해??',
  '너 없으면 어쩌려고 그래',
  '사실 네가 제일 웃겨',
  '너 때문에 힘들어 (좋은 의미)',
  '다음 생에도 친구하자',
  '솔직히 너 좀 부러워',
  '너랑 있으면 시간이 왜 이렇게 빨라',
  '가끔 네 생각나서 혼자 웃어',
  '야 너 진짜 대단하다',
  '너 없는 단톡방은 재미없어',
];

// API: 속마음 번역하기
app.post('/api/translate', (req, res) => {
  const { name, skipRanking } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: '이름을 입력해주세요.' });
  }

  const trimmedName = name.trim();
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
  } else {
    const existing = db.prepare('SELECT play_count FROM players WHERE name = ?').get(trimmedName);
    if (existing) playCount = existing.play_count;
  }

  res.json({ name: trimmedName, phrase, playCount });
});

// API: 랭킹 조회
app.get('/api/ranking', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 10;
  const offset = (page - 1) * limit;
  const search = req.query.search || '';

  let rows, total;

  if (search) {
    rows = db.prepare('SELECT name, play_count FROM players WHERE name LIKE ? ORDER BY play_count DESC LIMIT ? OFFSET ?')
      .all(`%${search}%`, limit, offset);
    total = db.prepare('SELECT COUNT(*) as count FROM players WHERE name LIKE ?').get(`%${search}%`).count;
  } else {
    rows = db.prepare('SELECT name, play_count FROM players ORDER BY play_count DESC LIMIT ? OFFSET ?')
      .all(limit, offset);
    total = db.prepare('SELECT COUNT(*) as count FROM players').get().count;
  }

  res.json({
    ranking: rows,
    totalPages: Math.ceil(total / limit),
    currentPage: page,
  });
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
