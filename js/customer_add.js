// customer_add.js

import { supabase } from "../supabase.js";

document.getElementById("saveCustomer").addEventListener("click", saveCustomer);

async function saveCustomer() {
    const name = document.getElementById("customerName").value.trim();
    const phone = document.getElementById("customerPhone").value.trim();

    if (!name) {
        alert("❗ الرجاء إدخال اسم العميل");
        return;
    }

    // إدخال العميل إلى جدول customers الصحيح
    const { data, error } = await supabase
        .from("customers")
        .insert([
            {
                name: name,
                phone: phone
            }
        ]);

    if (error) {
        console.error(error);
        alert("فشل الحفظ ‼️");
        return;
    }

    alert("✔️ تم حفظ العميل بنجاح");
    window.location.href = "customers.html";
}
