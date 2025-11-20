import { supabase } from "./supabase.js";

// تحميل الأصناف عند فتح الصفحة
window.onload = loadProducts;

// إضافة صنف جديد
async function addProduct() {
    const name = document.getElementById("name").value.trim();
    const code = document.getElementById("code").value.trim();
    const buy = document.getElementById("buy").value.trim();
    const sell = document.getElementById("sell").value.trim();

    if (!name || !code || !buy || !sell) {
        alert("الرجاء تعبئة جميع الحقول");
        return;
    }

    const { error } = await supabase
        .from("products_simple")
        .insert([{ name, code, buy, sell }]);

    if (error) {
        alert("خطأ في الإضافة: " + error.message);
        return;
    }

    alert("تم إضافة الصنف بنجاح");
    clearInputs();
    loadProducts();
}

// مسح الحقول بعد الإضافة
function clearInputs() {
    document.getElementById("name").value = "";
    document.getElementById("code").value = "";
    document.getElementById("buy").value = "";
    document.getElementById("sell").value = "";
}

// تحميل الأصناف من Supabase
async function loadProducts() {
    const table = document.getElementById("products-table");
    table.innerHTML = "<tr><td colspan='5'>جاري التحميل...</td></tr>";

    const { data, error } = await supabase
        .from("products_simple")
        .select("*")
        .order("id", { ascending: false });

    if (error) {
        table.innerHTML = "<tr><td colspan='5'>حدث خطأ في جلب البيانات</td></tr>";
        return;
    }

    table.innerHTML = "";

    data.forEach(p => {
        const row = `
            <tr>
                <td>${p.name}</td>
                <td>${p.code}</td>
                <td>${p.buy}</td>
                <td>${p.sell}</td>
                <td>
                    <button onclick="deleteProduct(${p.id})" 
                    style="background:#d9534f;color:white;border:none;padding:5px 10px;border-radius:5px;">
                        حذف
                    </button>
                </td>
            </tr>
        `;
        table.innerHTML += row;
    });
}

// حذف صنف
async function deleteProduct(id) {
    if (!confirm("هل تريد حذف الصنف؟")) return;

    const { error } = await supabase
        .from("products_simple")
        .delete()
        .eq("id", id);

    if (error) {
        alert("فشل الحذف: " + error.message);
        return;
    }

    loadProducts();
}
