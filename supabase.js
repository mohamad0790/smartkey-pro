// supabase.js
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

// معلومات مشروعك
const SUPA_URL = "https://qvnxhqqewluqcdddltiw.supabase.co";
const SUPA_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2bnhocXFld2x1cWNkZGRsdGl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxMzMwMTMsImV4cCI6MjA3ODcwOTAxM30.5aw42Tx5Dj3ws4xHpErGYAulxN0OclPa3prDx_e_yR0";

// تصدير Supabase جاهز
export const supabase = createClient(SUPA_URL, SUPA_ANON_KEY);
