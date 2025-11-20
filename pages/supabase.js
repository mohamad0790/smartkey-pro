import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

// ضع الرابط والمفتاح الخاص بحسابك هنا
const supabaseUrl = "https://qvnxhqqewluqcdddltiw.supabase.co";
const supabaseKey = "اكتب_المفتاح_كامل_هنا";

export const supabase = createClient(supabaseUrl, supabaseKey);
