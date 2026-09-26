# 찐막 속마음 번역기

친구 이름을 넣으면 무작위 "속마음"을 보여 주고, 많이 돌린 이름을 실시간 랭킹으로 겨루는 웹앱입니다. 멋쟁이사자처럼 DAU 14기 안자안자팀 프로젝트입니다.

2026년 4월 실서비스로 운영했습니다 (현재 운영 종료).

## 기능
- 이름 입력 → 슬롯머신 연출과 함께 속마음 문구 출력, 공유
- 이름별 돌린 횟수 실시간 랭킹 (랭킹 미기록 옵션)
- 매크로 탐지: 같은 IP의 요청 간격 변동계수(CV)를 3단계로 분석
  1. 요청 간격 CV가 5% 미만이면 매크로
  2. 최근 CV 30개의 변동계수가 2% 미만이면 같은 패턴을 반복하는 매크로
  3. 그 값 30개의 변동계수가 2% 미만이면 패턴을 바꿔 가며 반복하는 매크로

## 기술
- 프론트엔드: React, Vite, React Router, Tailwind CSS
- 백엔드: Node.js, Express, SQLite(better-sqlite3), express-rate-limit
- 배포: Docker, GitHub Actions, Docker Hub, Nginx(HTTPS), AWS EC2

## 구조
```
client/   React 프론트엔드
server/   Express API 서버 (SQLite)
docs/     기획서, 기술 스택
```
배포 시에는 React 빌드 결과를 Express가 정적 파일로 서빙합니다.

## 실행
```bash
# 개발: 두 터미널에서
cd server && npm install && npm run dev
cd client && npm install && npm run dev
```

## 배포
`release` 브랜치에 push하면 GitHub Actions가 Docker 이미지를 빌드해 Docker Hub에 올리고, SSH로 서버에서 새 이미지를 받아 재시작합니다.

## 역할
기획 외 개발 전담 (나지성)
