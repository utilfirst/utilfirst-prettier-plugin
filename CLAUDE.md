# @utilfirst/prettier-plugin

Shared Prettier plugin for utilfirst projects. ESM-only, Prettier 3 peer, single bundled default export.

## Stack

- TypeScript, tsdown for bundling, vitest for tests
- Peer: `prettier@^3.0.0` (consumer provides the markdown parser and printer at runtime)
- Runtime dep: none (the plugin only re-exports prettier's markdown parser/printer with transforms)
- pnpm 11, Node ≥20.19 (toolchain pinned to Node 24 in `mise.toml`)

## Commands

- `pnpm install`: install dependencies
- `pnpm run setup-hooks`: wire the `simple-git-hooks` pre-commit (run once after clone)
- `pnpm run build`: bundle via tsdown to `dist/index.js` + `dist/index.d.ts`
- `pnpm test`: run vitest

## Directory layout

```
.github/workflows/
├── ci.yml                          Lint + build + test on PR
└── publish.yml                     Tag-triggered OIDC publish
src/
├── index.ts                        Plugin entry: wraps prettier's markdown parser/printer
├── index.test.ts                   Inline-snapshot vitest tests
└── prettier-markdown.d.ts          Ambient module shim for prettier/plugins/markdown
```

## Workflow

- After any file change: `pnpm exec eslint --fix <file>` and `pnpm exec prettier --write <file>`
- After finishing a set of related changes: `pnpm test` and `pnpm run lint:typecheck`

## Build and bundling

- `pnpm run build` runs tsdown. `prepack` chains it before `npm pack`/`publish`
- Output is `dist/index.js` + `dist/index.d.ts`. The `outExtensions: () => ({ js: ".js" })` override is load-bearing. Tsdown defaults to `.mjs`, but the `exports` field references `.js` to match `"type": "module"` convention
- `prettier` is the peer and is marked `external` in `tsdown.config.ts`. The plugin's transforms call into `prettier/plugins/markdown.parsers.markdown.parse` and `prettier/plugins/markdown.printers.mdast.print`, so the consumer's Prettier provides both the parser and the printer

## Prettier private subpath

- The plugin imports from `prettier/plugins/markdown`, which is not part of Prettier's public exports map. Prettier 3.x ships it as `./plugins/markdown.mjs` and Node's module resolution picks it up, but a future minor could move or rename the subpath. If that happens, the fix is to track Prettier's `plugins/` layout and update the import path. The shim at `src/prettier-markdown.d.ts` declares the minimal `Parser<Root>` / `Printer<Root>` shape we depend on
- `@types/mdast` types the AST at the boundary. Internal helpers operate on a structural `MdNode` superset because `collapseAutolinks` mutates a Link discriminator into an Html discriminator in place, which mdast's tagged union refuses

## Testing

- Test runner is vitest with `toMatchInlineSnapshot`. Each test calls `prettier.format` twice and asserts idempotence
- Snapshot tabWidth is 4, matching how brain (the original consumer) renders markdown

## Lifecycle scripts

- No `prepare` and no `postinstall`. `simple-git-hooks` is wired through `pnpm run setup-hooks` instead. The earlier `postinstall`/`prepare` form tripped pnpm's `[ERR_PNPM_IGNORED_BUILDS]` gate on every consumer install, and the `false` opt-out in `pnpm-workspace.yaml` did not survive pnpm's auto-rewrite
- `prepack` runs the build before pack/publish so the tarball always contains a fresh `dist/`

## Consumer linking

- Sibling repos in `/Users/yenbekbay/Developer/` consume this plugin from npm at `^X.Y.Z`. For local iteration against unpublished changes, swap to `link:../utilfirst-prettier-plugin` (not `file:`, which triggers pnpm's ignored-build-scripts gate)

## GitHub Actions

- `ci.yml` runs a single leg against the Prettier 3 peer. No matrix, because `peerDependencies.prettier` is `^3.0.0` (single major). When Prettier 4 lands, add a matrix and update the peer

## Release

- One-time setup: configure an npm trusted publisher on npmjs.com pointing at scope `@utilfirst`, repo `utilfirst/utilfirst-prettier-plugin`, workflow `publish.yml`, environment `release`. Create a matching `release` GitHub environment
- First publish bootstraps the package via local `npm publish --provenance=false`, then add the trusted publisher to the now-existing package. Subsequent versions ride `publish.yml`. The bootstrap exists because npm's trusted publisher can't be configured for a non-existent package
- Each release: bump `version` in `package.json`, tag `vX.Y.Z`, push the tag. `publish.yml` builds, runs lint + test, packs, publishes with OIDC + automatic provenance, then emits release notes via changelogithub
- No `NPM_TOKEN`. The `release` environment is the gate

