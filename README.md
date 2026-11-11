# Talkvyn

Talkvyn is an open-source, self-hostable AI chat assistant for websites. Operators can run their own instance, connect their services, and apply their branding.

Read [PROJECT.md](PROJECT.md) for the product direction, architecture, roadmap, configuration, and licensing notes.

## Structure

- `apps/*` — applications
- `packages/*` — shared libraries and configuration

## Development setup

```sh
pnpm install
cp .env.example .env
pnpm services:up
pnpm --filter @talkvyn/api dev
```

The NestJS API lives in `apps/api`. Add other applications under `apps/` and shared packages under `packages/`. Root task scripts run workspace tasks through Turborepo for packages that define them.

The API listens on port `3001`, configured with `PORT`. `FRONTEND_PORT` defaults to `3000` and is available through the shared `@talkvyn/env` package for the dashboard's dev server. The dashboard app has not been added to this workspace yet, so its run script still needs to pass `FRONTEND_PORT` to the framework's port option. The API liveness endpoint is `GET /api/v1/health`. The shared environment package loads and validates the single root `.env` file. Set `SWAGGER_ENABLED=true` there to enable Swagger UI at `http://localhost:3001/api/docs` and the OpenAPI JSON at `http://localhost:3001/api/docs-json`.

The development stack in the root `compose.dev.yaml` provides PostgreSQL on `localhost:5432`, Redis on `localhost:6379`, and Mailpit SMTP on `localhost:1025` with its inbox UI at `http://localhost:8025`. Start and stop it with `pnpm services:up` and `pnpm services:down`; inspect it with `pnpm services:ps` and `pnpm services:logs`. Production Compose configuration belongs under `deploy/`.

## Code quality

```sh
pnpm lint
pnpm format
pnpm check
```

Oxlint checks JavaScript and TypeScript, and Prettier formats supported project files. Husky runs lint-staged on staged files before each commit and runs the full check pipeline before each push.

GitHub Actions runs `pnpm check` on every push and pull request.

## License

This project is released under the [MIT License](LICENSE). See [PROJECT.md](PROJECT.md#license-and-reuse) for a plain-language summary and branding notes.
