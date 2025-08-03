// Import the Supabase client factory
import { createClient } from "@supabase/supabase-js";

/**
 * Collect all available environment variables into a single object.
 *
 * `process.env` is inlined by bundlers such as Create React App/webpack, so we
 * grab it once here and then perform dynamic lookups on the resulting object.
 * This avoids relying on a runtime `process` polyfill, which is often missing
 * in browser builds and was the reason variables appeared as `undefined`.
 */
const ENV = {
  ...(typeof import.meta !== "undefined" && import.meta.env
    ? import.meta.env
    : {}),
  ...(typeof process !== "undefined" && process.env ? process.env : {}),
  ...(typeof globalThis !== "undefined" && globalThis.env ? globalThis.env : {}),
};

// Attempt to retrieve variables using multiple possible prefixes so it works
// with Create React App (REACT_APP_), Vite (VITE_) and generic names
const supabaseUrl =
  ENV.VITE_SUPABASE_URL || ENV.REACT_APP_SUPABASE_URL || ENV.SUPABASE_URL;
const supabaseAnonKey =
  ENV.VITE_SUPABASE_ANON_KEY ||
  ENV.REACT_APP_SUPABASE_ANON_KEY ||
  ENV.SUPABASE_ANON_KEY;

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
