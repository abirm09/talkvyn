# syntax=docker/dockerfile:1

FROM node:24-alpine AS build

WORKDIR /workspace
RUN corepack enable
ENV HUSKY=0

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY apps/api/package.json ./apps/api/package.json
COPY apps/api/nest-cli.json apps/api/tsconfig.json apps/api/tsconfig.build.json ./apps/api/
COPY packages/env/package.json packages/env/tsconfig.json ./packages/env/
COPY packages/database/package.json packages/database/tsconfig.json packages/database/prisma.config.ts ./packages/database/

RUN pnpm install --filter @talkvyn/api... --frozen-lockfile --prod=false
COPY apps/api/src ./apps/api/src
COPY packages/env/src ./packages/env/src
COPY packages/database/src ./packages/database/src
COPY packages/database/scripts ./packages/database/scripts

RUN pnpm --filter @talkvyn/api... build
RUN pnpm --filter @talkvyn/api --prod deploy --legacy /out

FROM node:24-alpine AS runtime

ENV NODE_ENV=production
ENV PORT=3001
ENV HOST=0.0.0.0
WORKDIR /app

COPY --from=build --chown=node:node /out/ ./

USER node
EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 CMD node -e "fetch('http://127.0.0.1:3001/api/v1/health').then((response) => process.exit(response.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "dist/main.js"]
