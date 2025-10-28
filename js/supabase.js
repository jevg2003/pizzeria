// js/supabase.js
const SUPABASE_URL = 'https://ydtbzwulmqrfjkbdunyg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlkdGJ6d3VsbXFyZmprYmR1bnlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyMjk4NDUsImV4cCI6MjA3NjgwNTg0NX0.NDN527W9x-2qOtee1Dox70B-sQ4pFHhYHKXTBnevh_s';

const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);