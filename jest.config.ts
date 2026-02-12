import type { Config } from "jest"
import nextJest from "next/jest.js"

const createJestConfig = nextJest({
    // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
    dir: "./",
})

// Add any custom config to be passed to Jest
const config: Config = {
    coverageProvider: "v8",
    testEnvironment: "jsdom",
    setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
    moduleNameMapper: {
        "^@/(.*)$": "<rootDir>/src/$1",
    },
    testMatch: [
        "**/__tests__/**/*.[jt]s?(x)",
        "**/?(*.)+(spec|test).[jt]s?(x)",
    ],
    testPathIgnorePatterns: [
        "/node_modules/",
        "src/components/loner/dialogs/spec.tsx", // Component file, not a test
    ],
    collectCoverageFrom: [
        "src/**/*.{js,jsx,ts,tsx}",
        "!src/**/*.d.ts",
        "!src/**/*.stories.{js,jsx,ts,tsx}",
    ],
}

// Override after next/jest merges its config — next/jest's own transformIgnorePatterns
// would block lucide-react from being transformed, causing ESM import errors.
const jestConfig = async () => {
    const nextConfig = await createJestConfig(config)()
    nextConfig.transformIgnorePatterns = [
        "/node_modules/(?!(lucide-react|jspdf|fflate|fast-png)/)",
        "^.+\\.module\\.(css|sass|scss)$",
    ]
    return nextConfig
}

export default jestConfig
