# Agent Coding Conventions

This project is a personal finance tracker with a Go/Fiber backend and a Vite React frontend. Keep changes small, typed, and consistent with the existing patterns.

## Frontend

- Use `date-fns` for date parsing, formatting, comparison, and arithmetic. Do not hand-roll date math with vanilla JavaScript `Date` methods.
- Prefer Flowbite React components for UI unless a custom component is clearly necessary or explicitly requested.
- When changing Flowbite component styling, update the app-level Flowbite theme provider instead of applying local one-off theme overrides.
- Use existing React Query/generated API hooks from `frontend/src/API` rather than adding ad hoc fetch calls.
- Keep component state local when it only drives presentation; lift state only when another component or API boundary needs it.
- Avoid editing generated files in `frontend/src/API` directly. Change `backend/schema/openapi.yaml` and rerun frontend codegen instead.
- Use `yarn` in `frontend` to match the existing lockfile.

## Backend

- Treat `backend/schema/openapi.yaml` as the API contract. Keep handler behavior, generated Go types, and frontend generated types in sync with schema changes.
- Do not edit `backend/api/gen.go` directly. Regenerate it through the existing Go generate setup when the OpenAPI schema changes.
- Format Go code with `gofmt` and prefer straightforward handler logic over broad abstractions.
- Return clear API errors through the existing response patterns instead of leaking internal errors.

## Generated Code

- Backend OpenAPI generation lives behind `backend/tools/tools.go`.
- Frontend API generation uses the `codegen` script in `frontend/package.json`.
- Generated files should be reviewed for expected contract changes, but source fixes should usually happen in the schema or generator inputs.

## Validation

- For frontend changes, run `yarn lint` and, for broader TypeScript/UI changes, `yarn build` from `frontend`.
- For backend changes, run `go test ./...` from `backend`.
- After changing OpenAPI schema, regenerate both backend and frontend API code and include the generated diffs.
