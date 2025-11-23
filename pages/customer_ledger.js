import { supabase } from "../supabase.js";

// إضافة عميل جديد
async function addCustomer() {
    const name = document.getElementById("customer_name").value;
    const phone = document.getElementById("phone").value;
    const address = document.getElementById("address").value;
    const notes = document.getElementById("notes").value;

    if (!name || !phone) {
        alert("الاسم ورقم الجوال مطلوبان");
        return;
    }

    const { data, error } = await supabase
        .from("customers")
        .insert([
            {
                customer_name: name,
                phone: phone,
                address: address,
                notes: notes
            }
        ]);

    if (error) {
        console.error(error);
        alert("خطأ في الإضافة: " + error.message);
    } else {
        alert("تم إضافة العميل بنجاح!");
        document.getElementById("customer_name").value = "";
        document.getElementById("phone").value = "";
        document.getElementById("address").value = "";
        document.getElementById("notes").value = "";
    }
}

window.addCustomer = addCustomer;
