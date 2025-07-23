// Import the Supabase client factory
import { createClient } from '@supabase/supabase-js';

// Retrieve environment variables for Supabase
// These should be defined in your .env file at the project root
// Example:
// SUPABASE_URL=https://your-project.supabase.co
// SUPABASE_ANON_KEY=your-anon-key
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

// Initialize the Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Export the client so it can be imported in other files
export default supabase;
