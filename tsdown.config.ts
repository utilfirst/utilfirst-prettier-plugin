import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/index.ts"],
  format: "esm",
  dts: true,
  clean: true,
  treeshake: true,
  external: ["prettier"],
  outExtensions: () => ({ js: ".js" }),
});
