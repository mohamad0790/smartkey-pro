import { supabase } from "../supabase.js";


// ==========================
// إضافة صنف جديد
// ==========================
window.addProduct = async function () {

    const product_code = document.getElementById("product_code").value.trim();
    const name = document.getElementById("name").value.trim();
    const buy = parseFloat(document.getElementById("buy").value);
    const sell = parseFloat(document.getElementById("sell").value);
    const quantity = parseInt(document.getElementById("quantity").value);

    if (!product_code || !name || isNaN(buy) || isNaN(sell) || isNaN(quantity)) {
        alert("❌ الرجاء تعبئة كل الحقول!");
        return;
    }

    const { error } = await supabase
        .from("products")
        .insert([{ product_code, name, buy, sell, quantity }]);

    if (error) {
        console.error(error);
        alert("❌ فشل إضافة الصنف");
        return;
    }

    alert("✔️ تم إضافة الصنف بنجاح");
    loadProducts();
};



// ==========================
// تحميل الأصناف
// ==========================
async function loadProducts(search = "") {

    let query = supabase.from("products").select("*").order("id", { ascending: false });

    if (search.trim() !== "") {
        query = query.ilike("name", `%${search}%`);
    }

    const { data, error } = await query;

    if (error) {
        console.error(error);
        return;
    }

    const table = document.getElementById("productsTableBody");
    table.innerHTML = "";

    data.forEach(item => {
        table.innerHTML += `
            <tr>
                <td>${item.product_code}</td>
                <td>${item.name}</td>
                <td>${item.buy}</td>
                <td>${item.sell}</td>
                <td>${item.quantity}</td>
                <td>${item.created_at?.substring(0,10) || ""}</td>

                <td>
                    <button onclick="editProduct(${item.id})" class="edit-btn">✏️</button>
                </td>
                <td>
                    <button onclick="deleteProduct(${item.id})" class="delete-btn">🗑️</button>
                </td>
            </tr>
        `;
    });
}

window.loadProducts = loadProducts;


// ==========================
// حذف الصنف
// ==========================
window.deleteProduct = async function (id) {
    if (!confirm("⚠️ هل تريد حذف هذا الصنف؟")) return;

    const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", id);

    if (error) {
        console.error(error);
        alert("❌ فشل حذف الصنف");
        return;
    }

    loadProducts();
};



// ==========================
// تعديل الصنف
// ==========================
window.editProduct = async function (id) {

    const newName = prompt("أدخل اسم جديد:");
    if (!newName) return;

    const { error } = await supabase
        .from("products")
        .update({ name: newName })
        .eq("id", id);

    if (error) {
        console.error(error);
        alert("❌ فشل التعديل");
        return;
    }

    loadProducts();
};



// ==========================
// البحث المباشر
// ==========================
document.getElementById("search").addEventListener("input", (e) => {
    loadProducts(e.target.value);
});


// تشغيل الصفحة
document.addEventListener("DOMContentLoaded", loadProducts);
