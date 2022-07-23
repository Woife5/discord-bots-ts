module.exports = {
    env: {
        node: true,
    },
    extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
    parser: "@typescript-eslint/parser",
    plugins: ["@typescript-eslint"],
    rules: {
        "@typescript-eslint/semi": ["error", "always"],
        quotes: ["error", "double", { avoidEscape: true }],
        "max-len": ["error", { code: 120, ignoreStrings: true, ignoreTemplateLiterals: true }],
        "comma-dangle": ["error", "always-multiline"],
    },
    root: true,
};
