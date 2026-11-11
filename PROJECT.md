# Talkvyn project guide

## What this project is

Talkvyn is an open-source, self-hostable AI chat assistant for websites. Anyone can clone the repository, configure their own services and branding, and deploy a Talkvyn instance for their website.

## Product capabilities

- Visitors chat with an AI assistant through an embedded website interface.
- AI replies use a provider configured by the site owner.
- Site owners provide the assistant's instructions, knowledge sources, and escalation rules.
- Human handoff gives visitors a path to a person when needed.
- Scoped MCP tools let the assistant submit orders, register complaints, and send contact requests through configured services.
- The interface, assistant identity, colors, logo, and wording are configurable for white-label use.
- Each operator controls their deployment, credentials, and data retention through self-hosting.

## Monorepo layout

```text
apps/
  web/                 Website, admin experience, and/or embeddable chat
packages/
  ui/                  Reusable interface components
  ai/                  Provider adapters, prompts, and response handling
  mcp/                 MCP server and business action tools
  config/              Shared configuration and validation
  ...                  Storage, auth, and other shared modules as needed
```

Keep deployable applications in `apps/` and reusable modules in `packages/`. Turborepo runs package scripts such as `build`, `dev`, `lint`, and `check-types` across the workspace.

## How a white-label installation should work

Each operator deploys their own copy and provides their own configuration. Branding is set through documented theme/config values, such as product name, logo, colors, welcome text, and assistant avatar. Provider credentials belong in server-side environment variables or a secret manager; they must not be embedded in browser code or committed to Git.

An installation may need to configure:

- An AI model provider and API key.
- A database and any file or knowledge storage.
- Authentication and allowed origins for the admin and chat interfaces.
- MCP integrations for orders, complaints, or contact requests.
- Retention, analytics, and deployment settings.

AI providers, hosting, databases, and external integrations may have their own costs, terms, and data handling policies. Each deployment documents its required variables and setup commands.

## AI chat behavior

The chat keeps provider-specific code behind an adapter so operators can select or replace a model provider. The server assembles the system instructions and permitted context, streams or returns the response, and records only the conversation data the operator has configured it to retain.

Operators control the assistant's identity and knowledge, review or remove conversation records, configure escalation, and disclose when a visitor is interacting with AI. The assistant does not claim that an order, complaint, or contact request was submitted until the configured integration confirms it.

## MCP actions and safeguards

MCP tools connect a conversation to explicit website actions:

- **Create order:** collect and validate required details, show the visitor a summary, obtain confirmation, then submit through the configured order system.
- **Register complaint:** collect the issue and any required reference details, confirm before submission, and return a receipt or reference when available.
- **Send contact request:** validate contact details and message, confirm submission, and report whether the configured service accepted it.

Tools should use narrow permissions and validate all input on the server. Protect credentials, apply authorization and rate limits, avoid duplicate submissions with idempotency where supported, and keep auditable outcomes without logging unnecessary sensitive data. Operators must configure which actions are enabled and which backends receive the submitted information.

## Privacy and security principles

- Keep secrets on the server and out of source control, browser bundles, and logs.
- Collect only information needed to answer a visitor or perform an explicitly requested action.
- Make data destinations, retention behavior, and AI-provider use clear to operators so they can disclose them to visitors.
- Provide an operator-controlled way to configure retention and deletion.
- Validate tool inputs and authorize every action on the server.
- Do not treat model output as authorization; require explicit visitor confirmation for consequential submissions.
- Document deployment hardening, backups, updates, and incident reporting as the product matures.

Deployments apply these principles and configure their own privacy practices to meet the requirements that apply to them.

## Development

Requirements: Node.js and pnpm. The repository pins its package manager version in `package.json`.

```sh
pnpm install
```

Applications live under `apps/` and shared packages under `packages/`. Run the matching root command, for example `pnpm dev` or `pnpm build`, for workspace tasks. Add environment variable names and safe example values to an `.env.example`; never commit real credentials.

## Contribution direction

Contributions keep the project usable as a self-hosted, rebrandable product. Before adding an integration, document its configuration, required permissions, data sent, and failure behavior. Keep provider credentials out of code and include suitable tests and documentation with each feature.

Contribution instructions, a code of conduct, security reporting guidance, and issue templates describe the project's maintainer process.

## License and reuse

The project code is distributed under the MIT License in [`LICENSE`](LICENSE). In practical terms, it allows people to use, copy, modify, redistribute, and sell the software, including in private or commercial products, while retaining the required copyright and license notice in copies or substantial portions. It is a permissive license and does not require downstream projects to publish their changes under MIT.

You may customize the product and give your deployed instance your own name and visual branding. The MIT software license does not itself grant rights to use another party's trademarks, logos, or brand identity. Check ownership and permissions for any name or asset before using it. Third-party dependencies and provider services remain subject to their own licenses and terms.

The license contains warranty and liability disclaimers. This summary is informational and does not replace the license text or legal advice.
