# Talkvyn

Talkvyn is an open-source, self-hostable AI chat assistant project. The goal is to let anyone run it, adapt it, and apply their own branding. The repository currently contains the monorepo starter; product features are planned.

Read [PROJECT.md](PROJECT.md) for the product direction, architecture, roadmap, configuration, and licensing notes.

## Structure

- `apps/*` — applications
- `packages/*` — shared libraries and configuration

## Development setup

```sh
pnpm install
pnpm dev
```

Add applications under `apps/` and shared packages under `packages/`. Root task scripts run workspace tasks through Turborepo for packages that define them.

## Code quality

```sh
pnpm lint
pnpm format
pnpm check
```

Oxlint checks JavaScript and TypeScript, and Prettier formats supported project files. Husky runs lint-staged on staged files before each commit and runs the full check pipeline before each push.

## License

This project is released under the [MIT License](LICENSE). See [PROJECT.md](PROJECT.md#license-and-reuse) for a plain-language summary and branding notes.
