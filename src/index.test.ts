import prettier from "prettier";
import { expect, test } from "vitest";
import plugin from "./index.ts";

async function format(src: string): Promise<string> {
  return prettier.format(src, {
    parser: "markdown",
    plugins: [plugin],
    tabWidth: 4,
  });
}

async function run(input: string): Promise<string> {
  const out = await format(input);
  expect(await format(out), "format must be idempotent").toBe(out);
  return out;
}

test("bare URL with trailing quad underscores stays literal", async () => {
  expect(await run("https://instagram.com/highnote_____\n"))
    .toMatchInlineSnapshot(`
    "https://instagram.com/highnote_____
    "
  `);
});

test("bare URL with intra-word underscores stays literal", async () => {
  expect(await run("https://instagram.com/u____p\n")).toMatchInlineSnapshot(`
    "https://instagram.com/u____p
    "
  `);
});

test("URL in list item with surrounding text", async () => {
  expect(await run("- mid see https://instagram.com/d____gallo here\n"))
    .toMatchInlineSnapshot(`
    "- mid see https://instagram.com/d____gallo here
    "
  `);
});

test("URL with trailing sentence punctuation", async () => {
  expect(
    await run("Visit https://instagram.com/offshore________, then continue.\n"),
  ).toMatchInlineSnapshot(`
    "Visit https://instagram.com/offshore________, then continue.
    "
  `);
});

test("bracket link with underscored URL stays bracketed", async () => {
  expect(await run("[name](https://instagram.com/foo_____) trailing\n"))
    .toMatchInlineSnapshot(`
    "[name](https://instagram.com/foo_____) trailing
    "
  `);
});

test("inline code containing URL is untouched", async () => {
  expect(await run("Use `https://foo_____bar` for the test.\n"))
    .toMatchInlineSnapshot(`
    "Use \`https://foo_____bar\` for the test.
    "
  `);
});

test("fenced code block containing URL is untouched", async () => {
  expect(await run("```\ncurl https://foo_____bar\n```\n"))
    .toMatchInlineSnapshot(`
    "\`\`\`
    curl https://foo_____bar
    \`\`\`
    "
  `);
});

test("existing autolink collapses to bare URL", async () => {
  expect(await run("<https://example.com/x_____>\n")).toMatchInlineSnapshot(`
    "https://example.com/x_____
    "
  `);
});

test("URL alongside emphasis and strong", async () => {
  expect(
    await run("See _italic_ and **bold** at https://example.com/x_____.\n"),
  ).toMatchInlineSnapshot(`
    "See _italic_ and **bold** at https://example.com/x_____.
    "
  `);
});

test("URL in ATX heading", async () => {
  expect(await run("# Title https://example.com/heading_____\n"))
    .toMatchInlineSnapshot(`
    "# Title https://example.com/heading_____
    "
  `);
});

test("URL in blockquote", async () => {
  expect(await run("> See https://example.com/quoted_____ here.\n"))
    .toMatchInlineSnapshot(`
    "> See https://example.com/quoted_____ here.
    "
  `);
});

test("URL in table cell", async () => {
  expect(
    await run(
      "| name | url |\n" +
        "| ---- | --- |\n" +
        "| foo | https://example.com/cell_____ |\n",
    ),
  ).toMatchInlineSnapshot(`
    "| name | url                           |
    | ---- | ----------------------------- |
    | foo  | https://example.com/cell_____ |
    "
  `);
});

test("reference-style link definition preserves URL", async () => {
  expect(
    await run("See [foo][ref].\n\n[ref]: https://example.com/refdef_____\n"),
  ).toMatchInlineSnapshot(`
    "See [foo][ref].

    [ref]: https://example.com/refdef_____
    "
  `);
});

test("multiple URLs on one line", async () => {
  expect(await run("First https://a.com/x_____ then https://b.com/y_____.\n"))
    .toMatchInlineSnapshot(`
    "First https://a.com/x_____ then https://b.com/y_____.
    "
  `);
});

test("emphasis still works without URLs", async () => {
  expect(await run("Some _italic_ and **bold** text.\n"))
    .toMatchInlineSnapshot(`
    "Some _italic_ and **bold** text.
    "
  `);
});

test("paragraph immediately above list keeps no gap", async () => {
  expect(await run("Call with Tabita:\n- Spot Film Festival\n"))
    .toMatchInlineSnapshot(`
    "Call with Tabita:
    - Spot Film Festival
    "
  `);
});

test("paragraph with existing blank before list loses the blank", async () => {
  expect(await run("Call with Tabita:\n\n- Spot Film Festival\n"))
    .toMatchInlineSnapshot(`
    "Call with Tabita:
    - Spot Film Festival
    "
  `);
});

test("paragraph above ordered list also merges", async () => {
  expect(await run("Things:\n1. a\n2. b\n")).toMatchInlineSnapshot(`
    "Things:
    1. a
    2. b
    "
  `);
});

test("paragraph without colon also merges", async () => {
  expect(await run("Random paragraph without colon\n\n- item\n"))
    .toMatchInlineSnapshot(`
    "Random paragraph without colon
    - item
    "
  `);
});

test("paragraph above non-list keeps blank line", async () => {
  expect(await run("Some paragraph.\n\nNot a list, just paragraph.\n"))
    .toMatchInlineSnapshot(`
    "Some paragraph.

    Not a list, just paragraph.
    "
  `);
});

test("multiple paragraph-list pairs merge independently", async () => {
  expect(await run("First:\n- a\n\nSecond:\n- b\n")).toMatchInlineSnapshot(`
    "First:
    - a

    Second:
    - b
    "
  `);
});

test("paragraph-list followed by unrelated paragraph", async () => {
  expect(await run("Intro:\n- a\n\nUnrelated paragraph after.\n"))
    .toMatchInlineSnapshot(`
    "Intro:
    - a

    Unrelated paragraph after.
    "
  `);
});

test("heading immediately above list keeps blank line", async () => {
  expect(await run("# Heading\n- item\n")).toMatchInlineSnapshot(`
    "# Heading

    - item
    "
  `);
});

test("paragraph carrying URL above list applies both fixes", async () => {
  expect(
    await run(
      "See https://instagram.com/highnote_____ for context:\n- detail one\n- detail two\n",
    ),
  ).toMatchInlineSnapshot(`
    "See https://instagram.com/highnote_____ for context:
    - detail one
    - detail two
    "
  `);
});

test("nested paragraph-sublist inside listItem stays flush (Prettier-native)", async () => {
  expect(await run("- Outer item:\n    - sub a\n    - sub b\n"))
    .toMatchInlineSnapshot(`
    "- Outer item:
        - sub a
        - sub b
    "
  `);
});
