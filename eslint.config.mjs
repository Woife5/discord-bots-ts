import typescriptEslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all,
});

export default [
    {
        ignores: ["**/build", "**/node_modules", "**/pnpm-lock.yaml", "**/package.json", "**/*.js"],
    },
    ...compat.extends("eslint:recommended", "plugin:@typescript-eslint/recommended"),
    {
        plugins: {
            "@typescript-eslint": typescriptEslint,
        },

        languageOptions: {
            parser: tsParser,
        },

        rules: {
            "@typescript-eslint/semi": ["error", "always"],

            quotes: [
                "error",
                "double",
                {
                    avoidEscape: true,
                },
            ],

            "max-len": [
                "error",
                {
                    code: 120,
                    ignoreStrings: true,
                    ignoreTemplateLiterals: true,
                    ignoreComments: true,
                },
            ],

            "comma-dangle": ["error", "always-multiline"],
            "object-curly-spacing": ["error", "always"],
            "eol-last": ["error", "always"],
            "no-console": ["warn"],
            curly: ["error", "all"],
            "handle-callback-err": ["error", "^(err|error)$"],

            "no-shadow": [
                "error",
                {
                    allow: ["err", "error", "Role"],
                },
            ],

            "no-undef-init": ["error"],
        },
    },
];
