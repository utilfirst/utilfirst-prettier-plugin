declare module "prettier/plugins/markdown" {
  import type { Root } from "mdast";
  import type { Parser, Printer } from "prettier";

  export const parsers: { markdown: Parser<Root> };
  export const printers: { mdast: Printer<Root> };
}
