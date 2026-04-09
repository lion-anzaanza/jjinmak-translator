const { execSync } = require('child_process');

const name = process.argv[2];
if (!name) {
  console.log('사용법: npm run delete-player -- "이름"');
  process.exit(1);
}

const ssh = 'ssh -i C:/Users/pupaj/.ssh/jjinmak.pem -p 20022 ec2-user@13.125.78.175';
const nodeCmd = `
const Database = require('better-sqlite3');
const db = new Database('/app/db/jjinmak.db');
const row = db.prepare('SELECT * FROM players WHERE name = ?').get('${name}');
if (row) {
  db.prepare('DELETE FROM players WHERE name = ?').run('${name}');
  console.log('삭제 완료: ' + row.name + ' (' + row.play_count + '판)');
} else {
  console.log('해당 이름이 없습니다: ${name}');
}
db.close();
`.trim().replace(/\n/g, ' ');

try {
  const result = execSync(`${ssh} "docker exec jjinmak node -e \\"${nodeCmd}\\""`, { encoding: 'utf-8' });
  console.log(result.trim());
} catch (e) {
  console.error(e.stderr || e.message);
}
