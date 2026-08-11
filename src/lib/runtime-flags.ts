type RuntimeEnvironment = {
  NODE_ENV?: string;
  MOCK_DATA?: string;
};

/**
 * Mock prospect data is a local-development aid only. It can never be enabled
 * in a production build and is intentionally controlled by a server-only flag.
 */
export function isMockDataEnabled(
  env: RuntimeEnvironment = process.env
): boolean {
  return env.NODE_ENV !== "production" && env.MOCK_DATA === "true";
}
