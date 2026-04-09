# 1단계: React 빌드
FROM node:20-alpine AS client-build
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# 2단계: 서버 + 빌드 결과물
FROM node:20-alpine
WORKDIR /app
COPY server/package*.json ./
RUN npm ci --omit=dev
COPY server/ ./
COPY --from=client-build /app/client/dist ./public

ENV NODE_ENV=production
ENV PORT=5000
EXPOSE 5000
CMD ["node", "index.js"]
