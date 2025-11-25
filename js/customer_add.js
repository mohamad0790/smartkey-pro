import { supabase } from "../supabase.js";

// إضافة العميل
document.getElementById("saveCustomer").addEventListener("click", async () => {
    const name = document.getElementById("customerName").value.trim();
    const phone = document.getElementById("customerPhone").value.trim();

    if (!name || !phone) {
        alert("⚠️ الرجاء إدخال الاسم ورقم الجوال");
        return;
    }

    const { error } = await supabase
        .from("customers")
        .insert([{ name, phone }]);

    if (error) {
        alert("❌ فشل الحفظ");
        console.log(error);
    } else {
        alert("✅ تم إضافة العميل بنجاح");
        document.getElementById("customerName").value = "";
        document.getElementById("customerPhone").value = "";
    }
});
