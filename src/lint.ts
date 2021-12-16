#!/usr/bin/env node
import "@typescript-eslint/parser";
import commandLineArgs from "command-line-args";
import { ESLint } from "eslint";
import fs from "fs";
import path from "path";
import { dirname } from "path";

const helperFilePath = __filename;
const helperProjectDir = dirname(require.resolve(helperFilePath));

export async function lintEslintWithApi(
  patterns: string[] | null,
  fix: boolean,
  fixDryRun: boolean,
  fixStdout: boolean,
  format: string,
  stdin?: string,
  stdinFilepath?: string
) {
  try {
    const projectIgnorePath = path.join(process.cwd(), ".eslintignore");

    const eslint = new ESLint({
      cwd: helperProjectDir,
      fix: fix || fixDryRun || fixStdout,
      baseConfig: {
        parser: "@typescript-eslint/parser",
        env: {
          node: true,
          es6: true,
          mocha: true,
        },
        plugins: [
          "@typescript-eslint",
          "react",
          "react-hooks",
          "jsx-a11y",
          "import",
          "prettier",
        ],
        extends: [
          "eslint:recommended",
          "plugin:@typescript-eslint/recommended",
          "plugin:react-hooks/recommended",
          "plugin:prettier/recommended",
        ],
        globals: {
          Atomics: "readonly",
          SharedArrayBuffer: "readonly",
        },
        parserOptions: {
          ecmaVersion: 2018,
          sourceType: "module",
        },
        ignorePatterns: ["node_modules", "build", "*-build", "*.json"],
        rules: {
          "no-console": "warn",
          "no-shadow": "warn",
          "ignored-by-default": 0,
          "@typescript-eslint/no-unused-vars": [
            "warn",
            {
              vars: "all",
              args: "after-used",
              argsIgnorePattern: "^_",
              varsIgnorePattern: "^_",
            },
          ],
          "@typescript-eslint/no-non-null-assertion": 0,
          "@typescript-eslint/ban-ts-ignore": 0,
          "@typescript-eslint/ban-ts-comment": 0,
          "@typescript-eslint/explicit-function-return-type": 0,
          "@typescript-eslint/explicit-module-boundary-types": 0,
          "prettier/prettier": [
            "error",
            {
              trailingComma: "es5",
              singleQuote: true,
              printWidth: 120,
              arrowParens: "avoid",
              importOrder: ["^[./]"],
              importOrderSeparation: true,
            }
          ],
        },
      },
      useEslintrc: false,
      ignorePath: fs.existsSync(projectIgnorePath)
        ? projectIgnorePath
        : undefined,
    });

    let results = null;

    if (patterns) {
      const paths = patterns.map((p) => path.join(process.cwd(), p));
      results = await eslint.lintFiles(paths);
    } else if (stdin) {
      results = await eslint.lintText(stdin, { filePath: stdinFilepath });
    } else {
      // eslint-disable-next-line no-console
      console.error("No files specified!");
      process.exit(1);
    }

    if (fix) {
      await ESLint.outputFixes(results);
    }

    const formatter = await eslint.loadFormatter(format);
    const resultText = formatter.format(results);

    if (fixStdout) {
      if (results[0] && results[0].output) {
        process.stdout.write(results[0].output);
      } else {
        process.stdout.write(stdin || '');
      }
    } else {
      // eslint-disable-next-line no-console
      console.log(resultText);
    }

    for (const r of results) {
      if ((!fix && !fixDryRun && !fixStdout) && (r.warningCount > 0 || r.errorCount > 0)) {
        process.exit(1);
      }
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("error performing eslint", err);
    process.exit(1);
  }
}

const options = commandLineArgs([
  { name: "patterns", defaultOption: true, multiple: true, type: String },
  { name: "fix", type: Boolean },
  { name: "fix-dry-run", type: Boolean },
  { name: "fix-to-stdout", type: Boolean },
  { name: "stdin", type: Boolean },
  { name: "stdin-filename", type: String },
  { name: "format", alias: "f", type: String, defaultValue: "stylish" },
  { name: "config", alias: "c", type: String },
  { name: "version", alias: "v", type: Boolean },
]);

if (options.version) {
  // eslint-disable-next-line no-console
  console.log(ESLint.version);
  process.exit(0);
}

if (options.stdin) {
  lintEslintWithApi(
    null,
    options.fix,
    options["fix-dry-run"],
    options["fix-to-stdout"],
    options.format,
    fs.readFileSync(0, "utf-8"),
    options["stdin-filename"]
  );
} else {
  lintEslintWithApi(options.patterns, options.fix, options["fix-dry-run"], options["fix-to-stdout"], options.format);
}
