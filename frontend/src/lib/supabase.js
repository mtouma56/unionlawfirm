// Import the Supabase client factory
import { createClient } from "@supabase/supabase-js";

/**
 * Helper to retrieve environment variables regardless of the bundler or
 * execution context. It checks `import.meta.env`, `process.env` and any
 * variables attached to `globalThis` (useful in certain server setups).
 */
function getEnvVar(...keys) {
  for (const key of keys) {
    if (
      typeof import.meta !== "undefined" &&
      import.meta.env &&
      import.meta.env[key]
    ) {
      return import.meta.env[key];
    }
    if (typeof process !== "undefined" && process.env && process.env[key]) {
      return process.env[key];
    }
    if (
      typeof globalThis !== "undefined" &&
      globalThis.env &&
      globalThis.env[key]
    ) {
      return globalThis.env[key];
    }
  }
  return undefined;
}

// Attempt to retrieve variables using both Vite-style and generic names
const supabaseUrl = getEnvVar("VITE_SUPABASE_URL", "SUPABASE_URL");
const supabaseAnonKey = getEnvVar(
  "VITE_SUPABASE_ANON_KEY",
  "SUPABASE_ANON_KEY",
);

if (!supabaseUrl || !supabaseAnonKey) {
  // Provide a visible but non-blocking error in the console for missing vars
  console.error(
    "[Supabase] Supabase URL and/or Anon Key is missing in environment variables.",
  );
}

// Only create the client when both variables are available
const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

export default supabase;
