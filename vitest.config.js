const config = {
  test: {
    environment: "jsdom",
    include: ["app/**/*.test.{js,ts,tsx}", "scripts/**/*.test.mjs"],
    setupFiles: ["./vitest.setup.ts"]
  }
};

export default config;
