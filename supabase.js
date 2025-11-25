import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

export const supabase = createClient(
  "https://qvnxhqqewluqcdddltiw.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2bnhocXFld2x1cWNkZGRsdGl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxMzMwMTMsImV4cCI6MjA3ODcwOTAxM30.5aw42Tx5Dj3ws4xHpErGYAulxN0OclPa3prDx_e_yR0"
);
