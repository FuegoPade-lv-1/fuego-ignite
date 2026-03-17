import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fdxdypspaeixfmqyfeac.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZkeGR5cHNwYWVpeGZtcXlmZWFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyMjk2MTUsImV4cCI6MjA4NjgwNTYxNX0.tPiDjf9pi2U2Zq6kpKUtSqAnVcFsz0bHaeWHK5dahCg';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
