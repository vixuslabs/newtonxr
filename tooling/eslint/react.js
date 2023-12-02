/** @type {import('eslint').Linter.Config} */
const config = {
    plugins: ["@react-three"],
      extends: [
        "plugin:react/recommended",
        "plugin:react-hooks/recommended",
        "plugin:@react-three/recommended"
      ],
      rules: {
        "react/prop-types": "off",
        "react/no-unknown-property": ["off", { "ignore": ["args"] }],
      },
      globals: {
        React: "writable",
      },
      settings: {
        react: {
          version: "detect",
        },
      },
      env: {
        browser: true,
      },
    };
    
    module.exports = config;
    