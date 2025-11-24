// =========================
//  اتصال Supabase
// =========================
import { supabase } from "./../supabase.js";

// =========================
//  دالة إضافة صنف جديد
// =========================
async function addProduct(event) {
    event.preventDefault();

    // أخذ القيم من النموذج
    const product_code = document.getElementById("product_code").value.trim();
    const name = document.getElementById("name").value.trim();
    const buy = parseFloat(document.getElementById("buy").value);
    const sell = parseFloat(document.getElementById("sell").value);
    const quantity = parseInt(document.getElementById("quantity").value);

    // التحقق من القيم
    if (!product_code || !name || isNaN(buy) || isNaN(sell) || isNaN(quantity)) {
        alert("❌ الرجاء تعبئة جميع الحقول بشكل صحيح.");
        return;
    }

    // إرسال البيانات إلى جدول products
    const { data, error } = await supabase
        .from("products")
        .insert([
            {
                product_code: product_code,
                name: name,
                buy: buy,
                sell: sell,
                quantity: quantity
            }
        ]);

    // فحص الأخطاء
    if (error) {
        console.error("خطأ أثناء إضافة الصنف:", error);
        alert("❌ فشل الحفظ! تحقق من البيانات أو الاتصال.");
        return;
    }

    // نجاح الإضافة
    alert("✅ تم إضافة الصنف بنجاح!");

    // تحديث الجدول بعد الإضافة
    loadProducts();

    // إعادة تعيين النموذج
    document.getElementById("productForm").reset();
}

// =========================
//  تحميل الأصناف من Supabase
// =========================
async function loadProducts() {
    const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("id", { ascending: true });

    if (error) {
        console.error("خطأ أثناء جلب البيانات:", error);
        return;
    }

    const tableBody = document.getElementById("productsTableBody");
    tableBody.innerHTML = "";

    data.forEach((item) => {
        const row = `
            <tr>
                <td>${item.product_code}</td>
                <td>${item.name}</td>
                <td>${item.buy}</td>
                <td>${item.sell}</td>
                <td>${item.quantity}</td>
                <td>${item.created_at ? item.created_at.substring(0, 10) : ""}</td>
            </tr>
        `;
        tableBody.insertAdjacentHTML("beforeend", row);
    });
}

// =========================
//  تشغيل الصفحة
// =========================
document.addEventListener("DOMContentLoaded", () => {
    loadProducts();

    const form = document.getElementById("productForm");
    if (form) form.addEventListener("submit", addProduct);
});
