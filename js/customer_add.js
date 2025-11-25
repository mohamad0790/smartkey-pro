import { supabase } from "../supabase.js";

async function saveCustomer() {
    const name = document.getElementById("name").value.trim();
    const phone = document.getElementById("phone").value.trim();

    if (!name) {
        alert("❗ اكتب اسم العميل");
        return;
    }

    const { error } = await supabase
        .from("customers")
        .insert([{ name, phone, balance: 0 }]);

    if (error) {
        alert("⚠ خطأ في الحفظ");
        console.error(error);
        return;
    }

    alert("✔ تم إضافة العميل بنجاح");
    window.location.href = "customers.html";
}

window.saveCustomer = saveCustomer;
