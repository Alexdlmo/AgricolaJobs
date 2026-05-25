import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://smjbepcthtzqtkjjhttr.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNtamJlcGN0aHR6cXRrampodHRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc2Mjg5MjYsImV4cCI6MjA5MzIwNDkyNn0.luHz4bf9C0lIcL59L6F3SPbI4fAZo8guJ0srUtjHncM'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export const getSupabaseUrl = () => supabaseUrl
export const getSupabaseKey = () => supabaseAnonKey