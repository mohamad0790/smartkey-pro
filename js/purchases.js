import { supabase } from "../supabase.js";

let imageBase64 = null;

// تحميل الموردين
window.onload = () => {
    loadSuppliers();
};

// قائمة الموردين
async function loadSuppliers() {
    const { data } = await supabase.from("suppliers").select("*");
    const sel = document.getElementById("supplier");

    data.forEach(s => {
        sel.innerHTML += `<option value="${s.id}">${s.name}</option>`;
    });
}

// عرض الصورة مباشرة
document.getElementById("imageFile").onchange = function (e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
        imageBase64 = reader.result;
        const img = document.getElementById("preview");
        img.src = imageBase64;
        img.style.display = "block";
    };
    reader.readAsDataURL(file);
};

// حساب الإجمالي مباشرة
["buy", "qty"].forEach(id => {
    document.getElementById(id).oninput = () => {
        const buy = Number(document.getElementById("buy").value);
        const qty = Number(document.getElementById("qty").value);
        document.getElementById("total").textContent = buy * qty || 0;
    };
});

// حفظ عملية الشراء
window.savePurchase = async function () {
    const supplier_id = document.getElementById("supplier").value;
    const code = document.getElementById("code").value.trim();
    const name = document.getElementById("name").value.trim();
    const buy_price = Number(document.getElementById("buy").value);
    const qty = Number(document.getElementById("qty").value);
    const total = buy_price * qty;

    if (!supplier_id || !code || !name || buy_price <= 0 || qty <= 0) {
        return alert("⚠️ الرجاء تعبئة البيانات كاملة");
    }

    // 1) إضافة الصنف إذا غير موجود
    let { data: product } = await supabase
        .from("products")
        .select("*")
        .eq("code", code)
        .single();

    if (!product) {
        const insertRes = await supabase.from("products").insert([
            {
                code,
                name,
                buy_price,
                sell_price: 0,
                stock: qty,
                image: imageBase64
            }
        ]).select().single();

        product = insertRes.data;
    } else {
        // تحديث المخزون فقط
        await supabase
            .from("products")
            .update({
                buy_price,
                stock: product.stock + qty,
                image: imageBase64 || product.image
            })
            .eq("id", product.id);
    }

    // 2) إنشاء فاتورة مشتريات
    const purchase = await supabase
        .from("purchases")
        .insert([
            {
                supplier_id,
                total
            }
        ])
        .select()
        .single();

    // 3) إضافة عناصر الفاتورة
    await supabase.from("purchase_items").insert([
        {
            purchase_id: purchase.data.id,
            product_id: product.id,
            qty,
            buy_price
        }
    ]);

    alert("✔ تم حفظ المشتريات");
    window.location.reload();
};
