import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fdxdypspaeixfmqyfeac.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZkeGR5cHNwYWVpeGZtcXlmZWFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA5MjIwNjAsImV4cCI6MjA1NjQ5ODA2MH0.bHz5x0nOjMiZSFnuMmCTgtBZsrkHJhFdOFTEr-P_U_Q';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
