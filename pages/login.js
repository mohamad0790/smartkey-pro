// --- استدعاء supabase ---
import { supabase } from "./supabase.js";

// --- دالة تسجيل الدخول ---
async function login() {
    const userId = document.getElementById("userId").value.trim();
    const pin = document.getElementById("pin").value.trim();
    const msg = document.getElementById("msg");

    // التحقق من إدخال البيانات
    if (!userId || !pin) {
        msg.textContent = "❗ الرجاء إدخال البيانات كاملة";
        msg.style.color = "red";
        return;
    }

    // البحث في جدول users
    const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .eq("pin", pin)
        .single();

    // إذا البيانات غلط
    if (error || !data) {
        msg.textContent = "❌ بيانات غير صحيحة";
        msg.style.color = "red";
        return;
    }

    // نجاح الدخول
    msg.textContent = "✅ تم تسجيل الدخول بنجاح";
    msg.style.color = "green";

    // حفظ المستخدم في التخزين
    localStorage.setItem("loggedUser", JSON.stringify(data));

    // الانتقال لصفحة الأصناف
    window.location.href = "./products.html";
}

// ربط الدالة بزر تسجيل الدخول
window.login = login;
