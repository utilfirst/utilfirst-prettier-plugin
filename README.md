# @utilfirst/prettier-plugin

Shared Prettier plugin for utilfirst projects. Targets markdown, Prettier 3.

## What it does

- Keeps bare URLs with trailing or intra-word underscores literal (e.g. `https://instagram.com/highnote_____` doesn't get rewritten as `**\_**`).
- Suppresses the blank line Prettier inserts between a paragraph and an immediately following list (lets you write `Intro:\n- item\n` and have it stay flush).

## Install

```sh
pnpm add -D @utilfirst/prettier-plugin
```

## Use

```js
// prettier.config.mjs
/** @type {import("prettier").Config} */
export default {
  plugins: ["@utilfirst/prettier-plugin"],
};
```

## Develop

```sh
pnpm install
pnpm run setup-hooks # one-time: wire pre-commit via simple-git-hooks
pnpm test            # vitest with inline snapshots
pnpm run build       # tsdown → dist/
pnpm run lint        # eslint + prettier + publint + tsc
```

## License

MIT
