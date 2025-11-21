import { supabase } from "./supabase.js";

async function login() {
    const userId = document.getElementById("user").value.trim();
    const pin = document.getElementById("pin").value.trim();

    if (!userId || !pin) {
        alert("⚠️ الرجاء إدخال البيانات كاملة");
        return;
    }

    const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .eq("pin", pin)
        .single();

    if (error || !data) {
        alert("❌ بيانات غير صحيحة");
        return;
    }

    alert("✅ تم تسجيل الدخول بنجاح");

    window.location.href = "products.html";
}

window.login = login;
