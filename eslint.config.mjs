import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

/**
 * ESLint Configuration for Scope AI
 * 
 * Philosophy: Warn, don't block. Fix incrementally.
 * 
 * Rule severity:
 * - "error" = Blocks build, must fix immediately
 * - "warn" = Shows in editor, fix when touching file
 * - "off" = Disabled entirely
 */
const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      // =========================================================================
      // TypeScript Rules
      // =========================================================================
      
      // Allow 'any' with warning - we have 112 casts, fix gradually using
      // type-guards.ts helpers (asRecord, asArray, hasProperty, etc.)
      "@typescript-eslint/no-explicit-any": "warn",
      
      // Allow @ts-ignore/@ts-expect-error with warning - sometimes needed
      // for third-party libs with bad types
      "@typescript-eslint/ban-ts-comment": "warn",
      
      // Allow unused vars if prefixed with underscore
      // e.g., const [_unused, setUsed] = useState()
      "@typescript-eslint/no-unused-vars": ["warn", { 
        "argsIgnorePattern": "^_", 
        "varsIgnorePattern": "^_" 
      }],
      
      // =========================================================================
      // React Hooks Rules
      // =========================================================================
      
      // Warn on missing deps - sometimes we intentionally omit deps
      // Add comment explaining WHY when disabling
      "react-hooks/exhaustive-deps": "warn",
      
      // Warn on setState in useEffect - can cause loops
      // but sometimes needed for derived state
      "react-hooks/set-state-in-effect": "warn",
    },
  },
]);

export default eslintConfig;
