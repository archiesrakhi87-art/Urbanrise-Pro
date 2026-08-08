// Vercel serverless function entry point.
// The Express app is pre-built by the buildCommand into
// artifacts/api-server/dist/vercel-handler.mjs before this file is processed.
export { default } from "../artifacts/api-server/dist/vercel-handler.mjs";
