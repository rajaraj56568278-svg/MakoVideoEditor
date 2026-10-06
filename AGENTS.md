# Mako workspace

<!-- managed by Mako: overwritten on template refresh. Put your own guidance
     in README.md, not here. -->

This repository is a Mako workspace: one git monorepo holding every data app
of the workspace. **`main` is production** — a commit on `main` deploys.

## Layout

- `apps/<folder>/…/<slug>/` — one app per folder holding a `mako.json`:
  a real Vite + React + TypeScript project. `mako.json` (`id`, title,
  entry), `bindings/<name>.sql` (data), `src/`, `package.json` +
  its lockfile (commit it). Folders between `apps/` and
  the app are plain organisation — move an app with `git mv` and it keeps
  its identity, which is the `id` in its manifest, never its path.
  `users/<userId>/apps/…` are personal apps.
- **Package manager: pnpm.** Use `pnpm install`, `pnpm add <pkg>`,
  `pnpm dev`, `pnpm build` — never `npm install` in a pnpm app: it
  ignores `pnpm-lock.yaml` and writes a competing `package-lock.json`.
  Mako installs each app with what its folder says (`pnpm-lock.yaml` or
  `"packageManager": "pnpm@…"` → pnpm, otherwise npm), so an app still on
  `package-lock.json` keeps working; convert it with `pnpm import`, then
  delete `package-lock.json` and set `packageManager`. Every new app is
  pnpm.
- **SDK and house style come from npm.** Apps depend on
  `"@makoai/app-sdk": "^2.7.0"` — a caret range: Mako's deploys move every
  app to the newest release inside it, so never vendor or copy the package
  into this repo. Its README (`node_modules/@makoai/app-sdk/README.md` after
  an install) documents the version the app has: the hooks, the vite plugin,
  and the house dashboard kit `@makoai/app-sdk/ui` (`PageHeader`, `Card`,
  `KpiTile`, `MultiSelect`, `FreshnessBadge`, `RefreshAllButton`, plus
  `ui.css`). The SDK injects the house theme tokens (`--background`,
  `--brand`, `--canvas`, `--chart-1…5`, …): style with them and use the
  kit — do not paste token blocks or fork those components into an app.
- `consoles/<folder>/<name>.sql` — saved consoles (`.js`, `.mongodb.js`
  for the other languages); `users/<userId>/consoles/…` are private ones.
  Leading `-- key: value` lines are metadata (`connection`, `database`,
  `description`, `schedule`); a commit here shows up in the app on push.
- `skills/<name>/SKILL.md` — workspace-taught agent skills (YAML
  frontmatter: `description` is the retrieval trigger; then the playbook).
  A commit here is in the agent's retrieval index by its next turn.
- `dbt/` — the workspace dbt project (`dbt_project.yml` at its root).
  Edits through Mako are commits; jobs and deploys build `main`.
- `PROMPT.md` — the workspace's custom agent prompt (business context,
  conventions). Every agent turn reads it from `main`; edit and commit it
  like any file.
- `.mako/workspace.json` — workspace id + template version (managed).
- `.mcp.json` — the `mako` MCP server for your agent (managed).

## Credentials (once per machine)

Two things need to reach Mako: your coding agent (over MCP) and the app's
local dev server (for data). Both sign in with your Mako account — no key to
paste:

1. `claude` (or Cursor / Codex) → the `mako` MCP server in `.mcp.json`
   opens a browser sign-in on first use: pick this workspace, approve
   (read-only). Claude Code: type `/mcp` if it does not prompt.
2. `npx @makoai/cli login` (or `mako login` once installed) in this checkout —
   the same sign-in, kept in `~/.mako/credentials.json` for `vite dev`.

That is ALL a fresh clone needs: the hosted `https://app.mako.ai` is the
built-in default everywhere (`.mcp.json`, the vite data plugin, the CLI) —
no `.env`, no key, no URL to configure.

Headless / CI instead: create a workspace API key in Mako (**Workspace
Settings → API Keys**, scopes `mcp` + `query:read`) and put it in a
`.env` at the repo root (gitignored): `MAKO_API_KEY=revops_…` — the FULL
key shown once at creation. Then `claude mcp add --transport http mako
$MAKO_API_URL/api/mcp --header "Authorization: Bearer $MAKO_API_KEY"`.
An API key, when present, is used instead of the login everywhere.

Self-hosted Mako: set `MAKO_API_URL` (`.env`, exported — `.envrc` does it
for direnv users) so `.mcp.json` and the dev server point at your host.
Beware: a stale `MAKO_API_URL` or `MAKO_API_KEY` in `.env` overrides the
login everywhere — if data stops loading, check `.env` first.

## How to work here

You are an ordinary developer in an ordinary checkout.

- **Files**: edit with YOUR tools (Read/Edit/Bash) in this checkout. The
  `app_*` file tools on the MCP server (`app_write_file`, `app_edit_file`,
  `app_bash`, `app_commit`, …) act on Mako's *cloud sandbox copy* of the
  repo, not on this checkout — do not use them for file work here.
- **Data**: the `mako` MCP server is the only way to the warehouse.
  `list_connections` → `list_tables` / `inspect_table` →
  `sql_execute_query` (read-only). Validate every query there BEFORE it
  goes into a binding. A *connection* is a configured credential — kind
  `database` (queryable) or `source` (a Stripe/Close/… key that flows
  read and `probe_connection` reads live); a *connector* is the code
  behind it (`list_connectors`).
- **Skills**: call `get_relevant_skills({ query })` before writing app code.
  The SDK API (`useQuery`, `useDuckDB`), binding front matter, chart and
  dialect guidance live there — not in this file. `load_skill("apps")` is
  the one to read first.
- **Eyes**: run the app yourself — `pnpm install && pnpm dev` inside
  `apps/<slug>` — and look at it with your own browser tooling. `run_app`,
  `app_open_app`, `app_browse` render the sandbox's checkout, not yours.
- **Memory**: durable workspace knowledge (schema quirks, conventions) goes
  to Mako via `read_self_directive` / `update_self_directive`, where every
  session and every teammate sees it — not to files local to this machine.

## Data in local dev

Each app's `vite.config.ts` includes `makoData()` from
`@makoai/app-sdk/vite`. During `vite dev` it answers
`__data/index.json` (the app's `bindings/*.sql`) and
`__data/<name>.parquet` from the Mako API with your login (or the key in
`.env`), built from your LOCAL `bindings/<name>.sql`: unchanged text is the
committed artifact, edited text is a draft built from your SQL and never
stored — edit a binding and reload to see its data before committing. The
SDK's `refresh()` (`POST __data/<name>/refresh`) rebuilds on demand. Results
are cached under `node_modules/.mako-data/` per binding text (5 minutes;
`?refresh` bypasses). `MAKO_DBT_ENV=<env>` in `.env` (or
`makoData({ dbtEnvironment })`) renders `{{ dbt_schema }}` against that dbt
environment, e.g. your personal one, instead of production.

Not signed in (and no key) → the app still runs, and every `useQuery` /
`useDuckDB` surfaces a "not connected: run `npx @makoai/cli login`" error
instead of data. An app whose
`vite.config.ts` predates the plugin: add
`import { makoData } from "@makoai/app-sdk/vite";` and `makoData()` to
`plugins`.

## Bindings

`bindings/<name>.sql` = one query with front matter comments:

```sql
-- connection: <connection id from list_connections>
-- materialization: parquet        # or: live
-- schedule: 0 6 * * *             # cron, for parquet
SELECT …
```

`useQuery("<name>")` in the app reads it. Materialize on demand with the
`app_materialize` tool (safe from a checkout: it builds from the committed
binding, keyed by content) or let the dev server do it on first load.

## Who is looking

`useViewer()` gives the signed-in person: `{ id, email, workspace: { id,
name, role }, app: { id, slug, role } }`, or `null` on an anonymous share.
Mako knows nothing else about people on purpose — team, country, seniority
are YOUR data: put a roster in a binding (`email` + the columns the app's
logic needs) and join it on the email in `useDuckDB`. `MAKO_VIEWER_AS=<email>`
in `.env` previews the app as another member during `pnpm dev`. See the
SDK README.

## Shipping

Commit on a branch, push, open a PR — or push to `main` to deploy directly.
Mako builds `main` and serves the app at `/apps/<slug>` for the workspace.
Uncommitted work exists only on this machine.

## Never

- commit `.env`, `node_modules/`, `dist/`, or parquet files;
- put a query in a binding that you did not run with `sql_execute_query`;
- vendor or copy `@makoai/app-sdk` (or a kit component) into the repo —
  depend on it from npm;
- edit `.mako/`, `.mcp.json` or this file — they are overwritten on
  refresh.
