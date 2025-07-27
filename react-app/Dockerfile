# --- 빌드 스테이지 ---
FROM node:20-alpine AS build
WORKDIR /app

# 1. 의존성 설치
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install

# 2. 소스 복사
COPY . .

# 3. Next.js 빌드
RUN pnpm build

# --- 실행 스테이지 ---
FROM node:20-alpine AS production
WORKDIR /app

# 빌드 결과와 필요한 파일 복사
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/package.json ./package.json

# 프로덕션 실행 준비
RUN npm install -g pnpm && pnpm install --prod

EXPOSE 3000
CMD ["pnpm", "start"]
