require('dotenv').config();
const { execSync } = require('child_process');

const keyword = process.argv[2];
if (!keyword) {
  console.log('사용법: npm run delete-player -- "키워드"');
  console.log('해당 키워드를 포함하는 모든 이름을 삭제합니다.');
  process.exit(1);
}

const { SSH_HOST, SSH_PORT, SSH_USER, SSH_KEY_PATH } = process.env;
if (!SSH_HOST || !SSH_PORT || !SSH_USER || !SSH_KEY_PATH) {
  console.error('server/.env 파일에 SSH 접속 정보를 설정해주세요.');
  process.exit(1);
}

const ssh = `ssh -i ${SSH_KEY_PATH} -p ${SSH_PORT} ${SSH_USER}@${SSH_HOST}`;
const keyB64 = Buffer.from(keyword).toString('base64');

const script = `
const Database = require('better-sqlite3');
const db = new Database('/app/db/jjinmak.db');
const keyword = Buffer.from('${keyB64}', 'base64').toString();
const rows = db.prepare("SELECT * FROM players WHERE name LIKE '%' || ? || '%'").all(keyword);
if (rows.length === 0) {
  console.log('해당 키워드를 포함하는 이름이 없습니다: ' + keyword);
} else {
  rows.forEach(r => {
    db.prepare('DELETE FROM players WHERE id = ?').run(r.id);
    console.log('삭제: ' + r.name + ' (' + r.play_count + '판)');
  });
  console.log('총 ' + rows.length + '건 삭제 완료');
}
db.close();
`.trim();

const scriptB64 = Buffer.from(script).toString('base64');

try {
  const result = execSync(
    `${ssh} "docker exec jjinmak node -e \\"eval(Buffer.from('${scriptB64}','base64').toString())\\""`,
    { encoding: 'utf-8' }
  );
  console.log(result.trim());
} catch (e) {
  console.error(e.stderr || e.message);
}
