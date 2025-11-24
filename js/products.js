// =========================
//  اتصال Supabase
// =========================
import { supabase } from "https://mohamad0790.github.io/smartkey-pro/supabase.js";

// =========================
//  إضافة صنف جديد
// =========================
async function addProduct() {

    const product_code = document.getElementById("product_code").value.trim();
    const name = document.getElementById("name").value.trim();
    const buy = parseFloat(document.getElementById("buy").value);
    const sell = parseFloat(document.getElementById("sell").value);
    const quantity = parseInt(document.getElementById("quantity").value);

    // التحقق
    if (!product_code || !name || isNaN(buy) || isNaN(sell) || isNaN(quantity)) {
        alert("❌ الرجاء تعبئة جميع الحقول بشكل صحيح.");
        return;
    }

    // الإرسال لسوبابيز
    const { data, error } = await supabase
        .from("products")
        .insert([{ product_code, name, buy, sell, quantity }]);

    if (error) {
        console.error("خطأ إضافة:", error);
        alert("❌ فشل إضافة الصنف، تحقق من الاتصال.");
        return;
    }

    alert("✅ تم إضافة الصنف بنجاح!");

    loadProducts();
}

// =========================
//  تحميل الأصناف
// =========================
async function loadProducts() {

    const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("id", { ascending: true });

    if (error) {
        console.error("خطأ تحميل:", error);
        return;
    }

    const tableBody = document.getElementById("productsTableBody");
    tableBody.innerHTML = "";

    data.forEach(item => {
        tableBody.innerHTML += `
            <tr>
                <td>${item.product_code}</td>
                <td>${item.name}</td>
                <td>${item.buy}</td>
                <td>${item.sell}</td>
                <td>${item.quantity}</td>
                <td>${item.created_at ? item.created_at.substring(0, 10) : ""}</td>
            </tr>
        `;
    });
}

// تشغيل عند فتح الصفحة
document.addEventListener("DOMContentLoaded", loadProducts);

// جعل الدالة متاحة للزر
window.addProduct = addProduct;
