/** @type {import("eslint").Linter.Config} */
const config = {
  extends: [
    "turbo",
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended-type-checked",
    "plugin:@typescript-eslint/stylistic-type-checked",
    "prettier",
  ],
  env: {
    es2022: true,
    node: true,
  },
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: true,
  },
  plugins: ["import", "@typescript-eslint"],
  rules: {
    // "@typescript-eslint/array-type": "off",
    // "@typescript-eslint/consistent-type-definitions": "off",
    "react/no-unknown-property": "off",
    "@typescript-eslint/consistent-type-imports": [
      "warn",
      {
        prefer: "type-imports",
        fixStyle: "inline-type-imports",
      },
    ],
    "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    // "@typescript-eslint/no-misused-promises": [
    //   2,
    //   {
    //     "checksVoidReturn": { "attributes": false }
    //   }
    // ],
    "react/display-name": "off",
  },
  ignorePatterns: [
    "dist",
    "**/.eslintrc.cjs",
    "**/*.config.js",
    "**/*.config.cjs",
    "packages/config/**",
    "pnpm-lock.yaml",
    ".next",
  ],
  reportUnusedDisableDirectives: true,
};
module.exports = config;
