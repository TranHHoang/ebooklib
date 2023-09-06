import configPrettier from "eslint-config-prettier";
import importPlugin from "eslint-plugin-import";
import simpleImportSortPlugin from "eslint-plugin-simple-import-sort";
import unicornPlugin from "eslint-plugin-unicorn";
import js from "@eslint/js";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";

/** @type {import("eslint").Linter.FlatConfig[]}*/
export default [
  js.configs.recommended,
  {
    ignores: ["*.config.js", "*.config.ts", "*.config.cjs", "lib/*"],
  },
  {
    files: ["**/*.ts"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: "./tsconfig.json",
      },
      ecmaVersion: "latest",
      globals: {
        document: true,
        console: true,
      },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
      import: importPlugin,
      unicorn: unicornPlugin,
      "simple-import-sort": simpleImportSortPlugin,
    },
    rules: {
      ...unicornPlugin.configs.recommended.rules,
      "unicorn/prevent-abbreviations": "off",
      "unicorn/no-null": "off",
      "unicorn/filename-case": "off",
      "unicorn/no-array-reduce": "off",
      "unicorn/no-await-expression-member": "off",
      ...tsPlugin.configs["eslint-recommended"].rules,
      ...tsPlugin.configs["strict-type-checked"].rules,
      ...tsPlugin.configs["stylistic-type-checked"].rules,
      "@typescript-eslint/no-non-null-assertion": "off",
      // "@typescript-eslint/prefer-nullish-coalescing": [
      //   "error",
      //   {
      //     ignorePrimitives: { string: true },
      //   },
      // ],
      "simple-import-sort/imports": [
        "error",
        {
          groups: [
            [
              "^\\w",
              "^@",
              "^~",
              // Side effect imports.
              "^\\u0000",
              // Parent folders
              "^\\.\\.(?!/?$)",
              "^\\.\\./?$",
              // Other relative imports. Put same-folder imports and `.` last.
              "^\\./(?=.*/)(?!/?$)",
              "^\\.(?!/?$)",
              "^\\./?$",
              // Others
              ".",
            ],
          ],
        },
      ],
      "simple-import-sort/exports": "error",
      "no-console": "error",
    },
    settings: {
      "import/extensions": [".ts"],
    },
  },
  configPrettier,
];
