import { defineConfig } from "tsup";

export default defineConfig((opts) => ({
  entry: ["./src/**/*"],
  dts: true,
  format: ["esm"],
  clean: !opts.watch,
  platform: "browser",
  bundle: false,
  banner: {
    js: "'use strict';",
  },
}));
