async function login() {
    const userId = document.getElementById("userId").value.trim();
    const pin = document.getElementById("pin").value.trim();
    const msg = document.getElementById("msg");

    if (!userId || !pin) {
        msg.textContent = "❗ الرجاء إدخال البيانات كاملة";
        return;
    }

    const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .eq("pin", pin)
        .single();

    if (error || !data) {
        msg.textContent = "❌ بيانات غير صحيحة";
        return;
    }

    // حفظ الجلسة
    localStorage.setItem("loggedUser", JSON.stringify(data));

    // فتح صفحة الأصناف
    window.location.href = "products.html";
}
