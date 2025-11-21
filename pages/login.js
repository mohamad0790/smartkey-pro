import { supabase } from "./supabase.js";

async function login() {
    const user = document.getElementById("user").value.trim();
    const pin = document.getElementById("pin").value.trim();
    const msg = document.getElementById("msg");

    msg.textContent = "";

    if (!user || !pin) {
        msg.textContent = "❗ الرجاء إدخال جميع البيانات";
        msg.style.color = "red";
        return;
    }

    // التحقق من المستخدم
    const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", user)
        .eq("pin", pin)
        .single();

    if (error || !data) {
        msg.textContent = "❌ بيانات غير صحيحة!";
        msg.style.color = "red";
        return;
    }

    // حفظ الجلسة داخل المتصفح
    localStorage.setItem("loggedUser", JSON.stringify(data));

    msg.textContent = "✔️ تم تسجيل الدخول بنجاح…";
    msg.style.color = "green";

    // الانتقال لصفحة المنتجات
    setTimeout(() => {
        window.location.href = "./products.html";
    }, 800);
}

window.login = login;
