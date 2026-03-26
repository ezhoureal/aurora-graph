## Tooling
- use `npm` to manage typescript dependencies. Prefer `node 24`.

## Development
- always read design summary from README.md in the module you're working on.
- always keep README.md in sync when making design changes

### Coding Style & Naming Conventions

- Language: TypeScript (ESM). Prefer strict typing; avoid any.
- Formatting/linting via Oxlint and Oxfmt.
- Never add @ts-nocheck and do not disable no-explicit-any; fix root causes and update Oxlint/Oxfmt config only when required.
- Dynamic import guardrail: do not mix await import("x") and static import ... from "x" for the same module in production code paths. If you need lazy loading, create a dedicated *.runtime.ts boundary (that re-exports from x) and dynamically import that boundary from lazy callers only.
- Dynamic import verification: after refactors that touch lazy-loading/module boundaries, run pnpm build and check for [INEFFECTIVE_DYNAMIC_IMPORT] warnings before submitting.
- Never share class behavior via prototype mutation (applyPrototypeMixins, Object.defineProperty on .prototype, or exporting Class.prototype for merges). Use explicit inheritance/composition (A extends B extends C) or helper composition so TypeScript can typecheck.
- If this pattern is needed, stop and get explicit approval before shipping; default behavior is to split/refactor into an explicit class hierarchy and keep members strongly typed.
- In tests, prefer per-instance stubs over prototype mutation (SomeClass.prototype.method = ...) unless a test explicitly documents why prototype-level patching is required.
- Add brief code comments for tricky or non-obvious logic.
- Keep files concise; extract helpers instead of “V2” copies. Use existing patterns for CLI options and dependency injection via createDefaultDeps.
- Aim to keep files under ~700 LOC; guideline only (not a hard guardrail). Split/refactor when it improves clarity or testability.