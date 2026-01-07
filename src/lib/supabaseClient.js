import { createClient } from '@supabase/supabase-js'

// Aquí pondremos tus claves reales cuando crees el proyecto en Supabase.com
const supabaseUrl = 'https://cygwpokvqbqngogmhmpz.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5Z3dwb2t2cWJxbmdvZ21obXB6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc1Njg0NzQsImV4cCI6MjA4MzE0NDQ3NH0.XEmdbUA_aGN4cUZW28oWrV8ZlTeHY7ncXiAEJYy6ijw'

export const supabase = createClient(supabaseUrl, supabaseKey)