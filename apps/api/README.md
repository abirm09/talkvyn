# Talkvyn API

The Talkvyn API is a self-hosted NestJS service in the pnpm/Turborepo workspace. It uses strict TypeScript, URI versioning, Zod-validated request payloads, validated environment configuration, request IDs, normalized error responses, security headers, and structured production logs.

## Requirements

- Node.js 24 or newer
- pnpm 12.15.0, as pinned by the workspace root

## Run locally

From the repository root:

```sh
pnpm install
cp .env.example .env
pnpm --filter @talkvyn/api dev
```

The API listens on `http://localhost:3001`. The shared `@talkvyn/env` package reads and validates the repository root `.env` file. Configure `CORS_ORIGINS` there with the exact origins allowed to call the API. The value is a comma-separated allowlist; wildcard origins are not used.

## Current HTTP contract

| Method   | Path                        | Purpose                                                      |
| -------- | --------------------------- | ------------------------------------------------------------ |
| `GET`    | `/api/v1/health`            | Liveness check for the API process                           |
| `POST`   | `/api/v1/staff-auth/login`  | Create a staff session                                       |
| `GET`    | `/api/v1/staff-auth/me`     | Get the current staff profile and permissions                |
| `POST`   | `/api/v1/staff-auth/logout` | Revoke the current staff session                             |
| `GET`    | `/api/v1/staff`             | List staff accounts (`staff:read`)                           |
| `GET`    | `/api/v1/staff/roles`       | List assignable roles (`staff:create`)                       |
| `POST`   | `/api/v1/staff`             | Create a staff account (`staff:create`)                      |
| `GET`    | `/api/v1/staff/:id`         | Get a staff account (`staff:read`)                           |
| `PATCH`  | `/api/v1/staff/:id`         | Update a staff account (`staff:update`)                      |
| `DELETE` | `/api/v1/staff/:id`         | Disable a staff account and revoke sessions (`staff:delete`) |

The health endpoint returns `status`, `service`, and an ISO 8601 `timestamp`. Every response includes an `X-Request-Id` header. Errors use a consistent JSON envelope with the HTTP status, safe message, request path, timestamp, and request ID.

When `SWAGGER_ENABLED=true`, Swagger UI is available at `http://localhost:3001/api/docs` and the generated OpenAPI document at `http://localhost:3001/api/docs-json`. Documentation is disabled by default and should stay disabled in public production deployments unless access is controlled.

## Configuration

| Variable                   | Default                 | Description                                                   |
| -------------------------- | ----------------------- | ------------------------------------------------------------- |
| `NODE_ENV`                 | `development`           | `development`, `test`, or `production`                        |
| `PORT`                     | `3001`                  | HTTP listen port                                              |
| `HOST`                     | `127.0.0.1`             | Interface to bind; containers use `0.0.0.0`                   |
| `CORS_ORIGINS`             | `http://localhost:3000` | Comma-separated list of allowed browser origins               |
| `SWAGGER_ENABLED`          | `false`                 | Enables Swagger UI and OpenAPI routes                         |
| `DATABASE_URL`             | —                       | Required PostgreSQL connection string                         |
| `STAFF_BOOTSTRAP_NAME`     | —                       | Optional initial administrator's display name                 |
| `STAFF_BOOTSTRAP_EMAIL`    | —                       | Optional initial administrator's email                        |
| `STAFF_BOOTSTRAP_PASSWORD` | —                       | Optional initial administrator's password (12–128 characters) |

Invalid configuration stops startup with a validation error. `DATABASE_URL` is required for staff authentication and management. The three `STAFF_BOOTSTRAP_*` values are optional, but must be supplied together when bootstrapping the first administrator. Keep real values in the root `.env` file or a deployment secret manager; commit only safe examples. Shared environment validation lives in `packages/env` and is available through the `@talkvyn/env/server` and `@talkvyn/env/client` entry points.

## Staff bootstrap and authentication

After starting PostgreSQL, sync the development schema and create the initial staff administrator:

```sh
pnpm --filter @talkvyn/database db:push
# Set STAFF_BOOTSTRAP_NAME, STAFF_BOOTSTRAP_EMAIL and STAFF_BOOTSTRAP_PASSWORD in .env.
pnpm --filter @talkvyn/database seed:staff
```

The seed command creates the built-in `administrator` and `staff` roles, the staff CRUD permissions, and the initial administrator. It is safe to rerun and does not reset an existing account's password. Passwords are stored as scrypt hashes. Login returns an opaque bearer token; only its hash is stored in the session table, and sessions expire after eight hours. Logout revokes the current session. Staff deletion is a soft disable that also revokes all of that staff member's sessions. Staff cannot change their own role or disable their own account through the management API.

Use `Authorization: Bearer <accessToken>` for authenticated endpoints. List endpoints accept `page` (default `1`), `perPage` (default `20`, maximum `100`), optional `q` (name search), and optional `status` (`active` or `disabled`). Staff create requires `name`, `email`, `password`, and `roleId`; passwords must contain 12–128 characters. The account response never includes the password hash.

Sign-in is limited to 30 attempts per IP and 5 attempts per email/IP pair in 15 minutes. The built-in limiter stores counters in process memory, so each API instance tracks its own limits; configure shared throttler storage before running multiple API instances behind a load balancer.

## Docker

Build from the repository root so Docker can use the pnpm workspace lockfile:

```sh
docker build -f apps/api/Dockerfile -t talkvyn-api .
docker run --rm --env-file .env -p 3001:3001 talkvyn-api
```

The image contains production dependencies only, runs as the unprivileged `node` user, and includes a container health check. Set `NODE_ENV=production` and keep `SWAGGER_ENABLED=false` in production unless the documentation routes are protected by the deployment.

## Workspace commands

```sh
pnpm --filter @talkvyn/api dev          # watch mode
pnpm --filter @talkvyn/api build        # production build
pnpm --filter @talkvyn/api start:prod   # run the production build
pnpm --filter @talkvyn/api lint         # Oxlint with type-aware rules
pnpm --filter @talkvyn/api check-types  # TypeScript check
pnpm --filter @talkvyn/api test         # Vitest
```

Root `pnpm check` runs formatting, lint, type checks, tests, and builds for configured workspace packages. Husky runs the staged-file checks before commits and the complete check pipeline before pushes.

## Architecture

Feature modules live under `src/`. Keep HTTP controllers focused on transport concerns and put application behavior in injectable services. Add chat, order, complaint, contact, and MCP modules as their contracts and provider adapters are defined. Keep provider credentials on the server and make external integrations configurable for each self-hosted instance.

The service uses Nest's Express adapter. The health route does not query the database, while staff authentication and management use the configured PostgreSQL database. AI provider integration will be added with the chat feature.

Global request middleware generates an `X-Request-Id`, carries it through async work with `getRequestId()`, and logs route templates, status codes, and durations. Logs do not include request URLs, query strings, or bodies. The exception filter uses the same request ID and route helper when reporting server errors.
