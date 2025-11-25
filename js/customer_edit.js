import { supabase } from "../supabase.js";

let customerId = null;

// تحميل بيانات العميل
async function loadCustomer() {
    customerId = localStorage.getItem("editCustomer");

    if (!customerId) {
        alert("لا يوجد عميل محدد");
        window.location.href = "customers.html";
        return;
    }

    const { data, error } = await supabase
        .from("customers")
        .select("*")
        .eq("id", customerId)
        .single();

    if (error || !data) {
        alert("حدث خطأ عند تحميل بيانات العميل");
        return;
    }

    document.getElementById("name").value = data.name ?? data.customer_name;
    document.getElementById("phone").value = data.phone ?? "";
    document.getElementById("note").value = data.note ?? "";
}

// حفظ التعديلات
async function updateCustomer() {
    const name = document.getElementById("name").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const note = document.getElementById("note").value.trim();

    if (!name) {
        alert("❗ اكتب اسم العميل");
        return;
    }

    const { error } = await supabase
        .from("customers")
        .update({ name, phone, note })
        .eq("id", customerId);

    if (error) {
        alert("⚠ خطأ أثناء الحفظ");
        console.error(error);
        return;
    }

    alert("✔ تم حفظ التعديلات بنجاح");
    window.location.href = "customers.html";
}

window.updateCustomer = updateCustomer;
window.addEventListener("load", loadCustomer);
