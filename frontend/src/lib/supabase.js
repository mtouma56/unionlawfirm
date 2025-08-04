// Import the Supabase client factory
import { createClient } from "@supabase/supabase-js";

/**
 * Helper to resolve an environment variable from a variety of sources.
 *
 * In development the values may come from `process.env` (CRA/webpack),
 * `import.meta.env` (Vite) or a custom global such as `window.env` used in
 * production deployments.  The lookup is performed dynamically at runtime so
 * the code works across different build tools without requiring a `process`
 * polyfill in the browser.
 */
function getEnvVar(name) {
  if (typeof import.meta !== "undefined" && import.meta.env && name in import.meta.env) {
    return import.meta.env[name];
  }
  if (typeof process !== "undefined" && process.env && name in process.env) {
    return process.env[name];
  }
  if (typeof globalThis !== "undefined" && globalThis.env && name in globalThis.env) {
    return globalThis.env[name];
  }
  return undefined;
}

// Attempt to retrieve variables using multiple possible prefixes so it works
// with Create React App (REACT_APP_), Vite (VITE_) and generic names.
const supabaseUrl =
  getEnvVar("VITE_SUPABASE_URL") ||
  getEnvVar("REACT_APP_SUPABASE_URL") ||
  getEnvVar("SUPABASE_URL");

const supabaseAnonKey =
  getEnvVar("VITE_SUPABASE_ANON_KEY") ||
  getEnvVar("REACT_APP_SUPABASE_ANON_KEY") ||
  getEnvVar("SUPABASE_ANON_KEY") ||
  // Support more generic env variable names that some setups may use
  getEnvVar("VITE_ANON_KEY") ||
  getEnvVar("REACT_APP_ANON_KEY") ||
  getEnvVar("ANON_KEY");

if (!supabaseUrl || !supabaseAnonKey) {
  // Provide a visible but non-blocking error in the console for missing vars
  console.error(
    "[Supabase] Supabase URL and/or Anon Key is missing in environment variables.",
    { supabaseUrl, supabaseAnonKeyPresent: Boolean(supabaseAnonKey) }
  );
} else {
  console.log("[Supabase] Client initialized", { supabaseUrl });
}

// Only create the client when both variables are available
const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

export default supabase;
