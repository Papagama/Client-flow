import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://otxezzddtnervmuoltcq.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_jlMrGUv9s91X2q1ZvDwP5g_4vYYonRt'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
