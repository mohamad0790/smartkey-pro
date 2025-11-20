import { supabase } from './supabase.js';

// تحميل الأصناف عند فتح الصفحة
document.addEventListener("DOMContentLoaded", loadProducts);

// دالة تحميل الأصناف
async function loadProducts() {
    const table = document.getElementById("productTable");
    table.innerHTML = "<tr><td colspan='5'>جارِ التحميل...</td></tr>";

    const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("id", { ascending: false });

    if (error) {
        table.innerHTML = "<tr><td colspan='5'>خطأ أثناء التحميل</td></tr>";
        return;
    }

    let rows = "";
    data.forEach(p => {
        rows += `
            <tr>
                <td>${p.code}</td>
                <td>${p.name}</td>
                <td>${p.buy}</td>
                <td>${p.sell}</td>
                <td><button class="del-btn" onclick="deleteProduct(${p.id})">حذف</button></td>
            </tr>
        `;
    });

    table.innerHTML = rows || "<tr><td colspan='5'>لا توجد أصناف</td></tr>";
}

// دالة إضافة صنف جديد
document.getElementById("addForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("name").value;
    const code = document.getElementById("code").value;
    const buy = document.getElementById("buy").value;
    const sell = document.getElementById("sell").value;

    const { error } = await supabase.from("products").insert([
        { name, code, buy, sell }
    ]);

    if (error) {
        alert("خطأ: لم يتم إضافة الصنف");
        return;
    }

    alert("تمت إضافة الصنف بنجاح");
    loadProducts();
    e.target.reset();
});

// دالة حذف صنف
async function deleteProduct(id) {
    if (!confirm("هل تريد حذف هذا الصنف؟")) return;

    const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", id);

    if (error) {
        alert("فشل الحذف");
        return;
    }

    alert("تم الحذف بنجاح");
    loadProducts();
}
