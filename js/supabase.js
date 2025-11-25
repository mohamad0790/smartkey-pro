// supabase.js

import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const supabaseUrl = "https://qvnxhqqewluqcdddltiw.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2bnhocXFld2x1cWNkZGRsdGl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxMzMwMTMsImV4cCI6MjA3ODcwOTAxM30.5aw42Tx5Dj3ws4xHpErGYAulxN0OclPa3prDx_e_yR0";

export const supabase = createClient(supabaseUrl, supabaseKey);
