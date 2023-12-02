import { defineConfig } from "tsup";

export default defineConfig((opts) => ({
  entry: ["./src/**/*"],
  dts: true,
  format: ["esm", "cjs"],
  clean: !opts.watch,
  esbuildOptions: (option) => {
    option.banner = {
      // to ensure compatibility with nextjs apps
      js: `"use client";`,
    };
  },
}));
