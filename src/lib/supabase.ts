import { createClient } from '@supabase/supabase-js';

// Provide fallback values for development
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables. Make sure to set VITE_SUPABASE_URL and VITE_SUPABASE_KEY in your .env.local file.');
}

export const supabase = createClient(supabaseUrl || '', supabaseKey || ''); 