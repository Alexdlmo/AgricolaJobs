import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://smjbepcthtzqtkjjhttr.supabase.co'
const supabaseAnonKey = 'sb_publishable_107w0zSyoItvM7HvTeE5Qg_ZFvwA5Xh'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export const getSupabaseUrl = () => supabaseUrl
export const getSupabaseKey = () => supabaseAnonKey