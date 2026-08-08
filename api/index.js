// Vercel serverless function entry point.
// The Express app is pre-built by the buildCommand into api/dist/ (copied
// from artifacts/api-server/dist/) so the import stays inside this directory
// and Vercel's function bundler can trace it correctly.
export { default } from "./dist/vercel-handler.mjs";
