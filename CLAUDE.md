# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

찐막 속마음 번역기 — 친구 이름을 입력하면 랜덤 "속마음" 문구를 슬롯머신 연출과 함께 보여주는 풀스택 웹앱. 랭킹 시스템으로 이름별 플레이 횟수를 추적하며, 매주 월요일 KST 00:00에 자동 초기화된다.

## Tech Stack

- **Frontend**: React (Vite) + React Router + Tailwind CSS v4 (`client/`)
- **Backend**: Express + better-sqlite3 + express-rate-limit (`server/`)
- **DB**: SQLite (`server/db/jjinmak.db`, gitignored, 볼륨 마운트로 영속)
- **배포**: GitHub Actions → DockerHub → EC2 (Nginx + Let's Encrypt)
- **도메인**: `jjinmak.anzaanza.cloud` (HTTPS)

## Development Commands

```bash
# 프론트엔드 개발 서버 (포트 3000, API → localhost:5000 프록시)
cd client && npm run dev

# 백엔드 개발 서버 (포트 5000, --watch 자동 재시작)
cd server && npm run dev

# 프론트엔드 빌드
cd client && npm run build
```

개발 시 client와 server를 각각 별도 터미널에서 동시 실행한다.

## DB Management Scripts

```bash
cd server

# 서버 DB 전체 초기화
npm run reset-db

# 특정 이름 삭제
npm run delete-player -- "이름"
```

SSH 접속 정보는 `server/.env`에서 관리 (gitignored).

## Architecture

- `client/src/pages/MainPage.jsx` — 이름 입력, 랭킹 목록 (검색/스크롤), 2컬럼 레이아웃
- `client/src/pages/ResultPage.jsx` — 슬롯머신 애니메이션, 무지개 그라데이션 결과, 공유/재시도
- `client/src/components/RankingList.jsx` — 랭킹 컴포넌트 (메달 SVG, 순위별 글로우, 동적 폰트 크기)
- `client/src/App.css` — 마블 배경, 스크롤바 숨김
- `client/src/fonts.css` — Gaegu, Kablammo, NeoDungGeunMo 폰트
- `server/index.js` — Express 서버, API, Rate Limit, 랭킹 초기화, 금지어 필터, 로깅
- `server/phrases.json` — 속마음 문구 목록
- `server/bannedWords.json` — 이름 금지어 목록
- `server/delete-player.js` — 원격 DB 이름 삭제 스크립트
- `server/reset-db.js` — 원격 DB 초기화 스크립트

## API

- `POST /api/translate` — 번역 실행 (Rate Limit: 초당 20회, 한글 완성형만, 금지어 필터)
- `GET /api/ranking` — 랭킹 조회 (TOP 20)
- `GET /api/search?name=` — 이름 검색 (순위 + 플레이 횟수)

## Deployment

- **브랜치**: `release` push 시 GitHub Actions 자동 배포
- **구조**: Nginx(:443 SSL) → Docker(:5000 Express)
- **DB 영속**: `~/jjinmak-data:/app/db` 볼륨 마운트
- **로그**: `~/jjinmak-data/logs/YYYY-MM-DD.json` (일자별 신규 플레이어)
- **SSL**: Let's Encrypt 자동 갱신 (certbot)

## Key Design Decisions

- 이름: 한글 완성형만 허용, 최대 5글자
- 판수(playCount): 세션 기준 1부터 시작 (랭킹과 무관)
- 슬롯머신: 0.7초 duration, 150ms interval
- 랭킹: 매주 월요일 KST 00:00 자동 초기화
- 모바일 반응형: md(768px) 브레이크포인트 기준

## Documentation

- `docs/기획서.md` — 제품 기획 (Notion 원본에서 가져옴)
- `docs/기술스택.md` — 기술 스택 정리

## Language

사용자 대면 콘텐츠와 문서는 한국어로 작성한다.
