/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";

/** @type {import("next").NextConfig} */
const config = {
  // Emits a self-contained `.next/standalone/server.js` with only the traced node_modules, which
  // keeps the Docker runtime image small. See `Dockerfile`.
  output: "standalone",
};

export default config;
