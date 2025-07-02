import { createClient } from "@supabase/supabase-js"

const supabaseUrl = "https://omylauagbfhcfjyjalwh.supabase.co"
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9teWxhdWFnYmZoY2ZqeWphbHdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAyNDEzMDUsImV4cCI6MjA2NTgxNzMwNX0.PBK69pc-peSjIs_hlnx_VZsBsPLu8_Io60Dc7QuaFB4"

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

console.log("Supabase Storage initialisé :", supabaseUrl)
