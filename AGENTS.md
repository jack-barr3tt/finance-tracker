# Agent Coding Conventions

This project is a personal finance tracker with a Go/Fiber backend and a Vite React frontend. Keep changes small, typed, and consistent with the existing patterns.

## Frontend

- Use `date-fns` for date parsing, formatting, comparison, and arithmetic. Do not hand-roll date math with vanilla JavaScript `Date` methods.
- Prefer Flowbite React components for UI unless a custom component is clearly necessary or explicitly requested.
- When changing Flowbite component styling, update the app-level Flowbite theme provider instead of applying local one-off theme overrides.
- Use existing React Query/generated API hooks from `frontend/src/API` rather than adding ad hoc fetch calls.
- Keep component state local when it only drives presentation; lift state only when another component or API boundary needs it.
- Avoid editing generated files in `frontend/src/API/index.ts` directly. Change `backend/schema/openapi.yaml` and rerun frontend codegen instead.
- Use `yarn` in `frontend` to match the existing lockfile.
- When changing UI behavior or layout, verify the result in the browser using the Cursor browser tool (`cursor-ide-browser` MCP). Navigate to the running dev server (typically `http://localhost:5173`), take snapshots or screenshots, and interact with the page to confirm the change works and looks right. Prefer this over guessing from code alone, especially for redirects, modals, filters, and other visual or interaction-heavy changes.

### Component style

- Prefer `export default function ComponentName()` — do not assign a component to a `const` and export that const. When a component needs a ref, accept `ref` as a normal prop and pass it through; do not use `forwardRef` or invent renamed ref props like `cardRef`.
- Component files use PascalCase (e.g. `ActualDisplay.tsx`). Hook files use camelCase (e.g. `useBudgetTransactionEditor.ts`).
- For responsive table/card layouts, reuse the existing Transactions patterns: `useMediaQuery("(min-width: 768px)")`, `DataCard`, `FormEditModal`, `ColoredBadge`, `TruncatedText`. Mirror that layout behaviour on other pages; do not build generic table/card frameworks.
- Avoid thin wrapper abstractions that do not earn their keep — e.g. passthrough layout components, shared breakpoint constant files, one-line helper modules, or hooks extracted only to dedupe similar data-fetching logic across editors. Inline at the call site when the code is simple and local.

## Backend

- Treat `backend/schema/openapi.yaml` as the API contract. Keep handler behavior, generated Go types, and frontend generated types in sync with schema changes.
- Do not edit `backend/api/gen.go` directly. Regenerate it through the existing Go generate setup when the OpenAPI schema changes.
- Format Go code with `gofmt` and prefer straightforward handler logic over broad abstractions.
- Return clear API errors through the existing response patterns instead of leaking internal errors.

## Database

- Schema changes go in [`database/schema.sql`](database/schema.sql). There is no migrations folder — the user applies DDL to their Postgres instance manually.
- **After editing the database schema, stop and ask the user to apply the changes before continuing** with backend handlers, frontend work, or verification. Do not assume the table or index already exists in the running database.

## Generated Code

- Backend OpenAPI generation lives behind `backend/tools/tools.go`.
- Frontend API generation uses Orval (`orval.config.ts`) and the `codegen` script in `frontend/package.json`.
- Generated API client: single file `frontend/src/API/index.ts`. Hand-written fetch mutator: `frontend/src/lib/api-mutator.ts`.
- Generated files should be reviewed for expected contract changes, but source fixes should usually happen in the schema or generator inputs.

### Regenerating API code

After changing `backend/schema/openapi.yaml`, regenerate both sides:

```bash
# Backend (from repo root)
zsh -lic 'cd backend/tools && go generate'

# Frontend
zsh -lic 'cd frontend && yarn codegen'
```

**Why `zsh -lic`?** This project uses GVM for Go. Cursor's default agent shell does not load `~/.zshrc`, so plain `go generate` / `go run` can fail silently (exit code 1, no output) because the expected Go toolchain is not on `PATH`. A login interactive zsh loads GVM and the commands succeed. If codegen fails with no output, try the commands above in your own terminal first.

Do **not** edit `backend/api/gen.go` or `frontend/src/API/index.ts` by hand — always change the OpenAPI schema and regenerate.

## Validation

- For frontend changes, run `yarn lint` and `yarn format:check` from `frontend`, and for broader TypeScript/UI changes, `yarn build`.
- For backend changes, run `golangci-lint run` and `go test ./api/...` from `backend`.
- After changing OpenAPI schema, regenerate both backend and frontend API code and include the generated diffs.
