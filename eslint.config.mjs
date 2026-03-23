import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "off",  // Allow any for flexibility
      "@typescript-eslint/no-unused-vars": "off",  // Allow unused vars temporarily
      "no-unused-vars": "off",
    },
  },
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      "src/test/**",           // Tests excluded from linting
      "src/generated/**",      // Prisma generated code
      "coverage/**",           // Coverage reports
      "prisma/seed.ts",       // Seed file, not part of app
    ],
  },
];

export default eslintConfig;
