# AGENTS.md

## Project Structure

Vue 3 SPA + Go WASM. The Go code in `wasm/` compiles to `src/sia/sia.wasm` and runs in a Web Worker. The JS app cannot function without the WASM binary.

Key paths:

- `wasm/main.go` → builds to `src/sia/sia.wasm`
- `src/sia/sia.worker.js` → loads and runs the WASM binary
- `src/sia/index.js` → JS interface to the WASM worker
- `src/store/` → Vuex state management
- `src/store/db.js`, `src/store/db/` → Dexie/IndexedDB persistence
- `src/router.js` → Vue Router
- `src/styles/vars.styl` → auto-imported Stylus variables

The `@` alias resolves to `src/`.

## Dev Commands

- `make run` — builds WASM, installs dependencies, and starts the Vite dev server
- `make build` — production build including WASM and Vite
- `make lint` — runs Go and JS/Vue linters
- `make build-wasm-testnet` — builds WASM with `-tags='testnet'`

WASM builds require Go 1.26+ and use `GOOS=js GOARCH=wasm`.

## Validation

Before considering a change complete:

- Run `make lint`.
- Run `make build` for changes affecting WASM, dependencies, Vite configuration, build configuration, or production bundling.
- There is currently no automated test suite. Manually reason through affected flows and edge cases.
- Do not claim a command passed unless you ran it.
- If validation cannot be run, state what was not run and why.

## Linting

- ESLint requires tabs, semicolons, and `multi-or-nest` curly braces.
- Go is linted with `GOOS=js GOARCH=wasm golangci-lint run`; see `.golangci.yml`.
- The pre-commit hook runs `lint-staged`, including `eslint --fix` on staged `.js` and `.vue` files.
- `dist/`, `public/`, `wasm/`, `**/wasm_exec.js`, and `**/sia.worker.js` are excluded from ESLint.

## Architecture

The WASM call path is:

`wasm/main.go` → `src/sia/sia.wasm` → `src/sia/sia.worker.js` → `src/sia/index.js`

Changes to the JS↔Go boundary must account for both sides. Verify serialization, callback behavior, and error propagation when modifying exported WASM functions or their JS callers.

Other architecture details:

- State management uses Vuex.
- Local persistence uses Dexie/IndexedDB.
- Styles use Stylus with `src/styles/vars.styl` auto-imported.
- `global` is aliased to `globalThis` for WASM/Node compatibility.
- `vite-plugin-node-polyfills` provides `Buffer` and `process` for Ledger dependencies.

## Generated Files

- Do not edit `src/sia/sia.wasm` directly; it is generated from `wasm/`.
- `wasm_exec.js` is copied from Go's GOROOT during the WASM build. Do not modify generated copies directly.
- Regenerate build artifacts through the Makefile targets.

## Gotchas

- Testnet WASM builds require `-tags='testnet'`.
- `SIASCAN_ADDRESS` in `wasm/main.go` points to the SiaCentral API.
- There is no automated test suite in this repository.
- Frontend functionality depends on a successfully built WASM binary.

## Code Quality

- Prefer simple, explicit control flow over abstractions that are only used once or hide behavior.
- Handle errors explicitly; do not swallow or ignore them.
- Avoid unrelated refactoring while implementing a scoped change.
- Do not add dependencies without strong justification. Frontend bundle size matters for a wallet application.
- Check for existing implementations before introducing duplicate logic.

## Security

Treat code involving seeds, keys, signing, encryption, or Ledger communication as security-sensitive.

- Never log seeds, private keys, signing material, or other secrets.
- Zero sensitive buffers when they are no longer needed.
- Do not weaken validation or error handling for convenience.
- Handle Ledger transport failures and disconnects explicitly.
- Prefer conservative changes over new abstractions in cryptographic or signing code.

## Comments and Documentation

- Do not narrate what the code does when the implementation is self-explanatory.
- Use comments for non-obvious reasons, safety invariants, compatibility constraints, or public API behavior.
- Do not add comments that restate variable names or function signatures.
- Keep doc comments on exported Go functions and public Vue component props/events.

## Review Checklist

For changes involving the JS↔WASM boundary:

- Verify serialization on both sides.
- Verify callback and error propagation.
- Check nil, empty, and malformed values crossing the boundary.
- Check for unnecessary allocations in Go/WASM code.

For security-sensitive changes:

- Verify sensitive data is never logged.
- Verify sensitive buffers are cleared when appropriate.
- Verify error paths do not bypass validation or cleanup.

For frontend changes:

- Avoid unnecessary dependencies and bundle-size increases.
- Follow existing Vue/Vuex patterns rather than introducing new frameworks or state-management approaches.
