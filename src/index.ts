import type { Root, RootContent } from "mdast";
import type { Doc, Plugin } from "prettier";
import * as md from "prettier/plugins/markdown";

// AST traversal mutates Link nodes into Html nodes in place, which is hostile
// to mdast's tagged union. Use a structural superset for the mutation surface.
type MdNode = {
  type: string;
  children?: MdNode[];
  url?: string;
  title?: string | null;
  value?: string;
};

const SCAN_RE =
  /(```[\s\S]*?```|~~~[\s\S]*?~~~|`[^`\n]*`|\[[^\]\n]*\]\([^)\n]*\)|<[^>\n]+>)|https?:\/\/[^\s<>)]+/g;

function wrapBareUrls(src: string): string {
  return src.replace(SCAN_RE, (match: string, keep: string | undefined) =>
    keep ? match : `<${match}>`,
  );
}

function collapseAutolinks(node: MdNode | undefined): void {
  if (
    node?.type === "link" &&
    node.children?.length === 1 &&
    node.url === node.children[0]?.value
  ) {
    node.type = "html";
    node.value = node.url!;
    delete node.children;
    delete node.url;
    delete node.title;
  }
  node?.children?.forEach(collapseAutolinks);
}

function suppressIntroListGap(
  rootDoc: Doc,
  children: readonly RootContent[],
): void {
  if (!Array.isArray(rootDoc)) {
    return;
  }
  const inner = rootDoc[0];
  if (!Array.isArray(inner)) {
    return;
  }
  for (let i = 0; i < children.length - 1; i++) {
    if (children[i]?.type === "paragraph" && children[i + 1]?.type === "list") {
      inner[3 * i + 2] = "";
    }
  }
}

// Wrap bare URLs as `<...>` autolinks before parsing so a trailing `____`
// run isn't parsed as `__strong__`, then collapse the link node to a raw
// `html` node so the printer emits the URL without the angle brackets.
//
// Also suppress the blank line Prettier inserts between a paragraph and an
// immediately following list. The Doc IR for a root with N children is
// `[child0, hl, hl, child1, hl, hl, ..., childN-1]` followed by a trailing
// hardline; replacing the second `hl` in a paragraph→list pair with `""`
// collapses the blank line to a single newline.
const plugin: Plugin<Root> = {
  parsers: {
    markdown: {
      ...md.parsers.markdown,
      async parse(text, options) {
        const wrapped = wrapBareUrls(text);
        options.originalText = wrapped;
        const ast = await md.parsers.markdown.parse(wrapped, options);
        collapseAutolinks(ast as unknown as MdNode);
        return ast;
      },
    },
  },
  printers: {
    mdast: {
      ...md.printers.mdast,
      print(path, options, print) {
        const doc = md.printers.mdast.print(path, options, print);
        const node = path.node as unknown as MdNode;
        if (node.type === "root") {
          suppressIntroListGap(doc, (node.children ?? []) as RootContent[]);
        }
        return doc;
      },
    },
  },
};

export default plugin;
