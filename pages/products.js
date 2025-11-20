import { supabase } from "./supabase.js";

// ======================
// تحميل الأصناف
// ======================
async function loadProducts() {
    const table = document.getElementById("productTable");
    table.innerHTML = "<tr><td colspan='5'>جاري التحميل...</td></tr>";

    const { data, error } = await supabase.from("products").select("*");

    if (error) {
        table.innerHTML = "<tr><td colspan='5'>خطأ في تحميل البيانات</td></tr>";
        console.log(error);
        return;
    }

    table.innerHTML = "";

    data.forEach(p => {
        table.innerHTML += `
            <tr>
                <td>${p.code}</td>
                <td>${p.name}</td>
                <td>${p.buy}</td>
                <td>${p.sell}</td>
                <td><button class="del-btn" onclick="deleteProduct('${p.id}')">حذف</button></td>
            </tr>
        `;
    });
}

// ======================
// إضافة صنف جديد
// ======================
document.getElementById("addForm").addEventListener("submit", async function(e) {
    e.preventDefault();

    const name = document.getElementById("name").value;
    const code = document.getElementById("code").value;
    const buy  = document.getElementById("buy").value;
    const sell = document.getElementById("sell").value;

    const { error } = await supabase.from("products").insert([
        { name, code, buy, sell }
    ]);

    if (error) {
        alert("خطأ في إضافة الصنف");
        console.log(error);
        return;
    }

    alert("تم إضافة الصنف ✔");
    this.reset();
    loadProducts();
});

// ======================
// حذف الصنف
// ======================
window.deleteProduct = async function(id) {
    if (!confirm("هل تريد حذف الصنف؟")) return;

    const { error } = await supabase.from("products").delete().eq("id", id);

    if (error) {
        alert("خطأ في الحذف");
        console.log(error);
        return;
    }

    alert("تم حذف الصنف ✔");
    loadProducts();
};

// تحميل عند فتح الصفحة
loadProducts();
