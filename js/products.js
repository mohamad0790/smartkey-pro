import { supabase } from "../supabase.js";

document.getElementById("addProduct").addEventListener("click", async () => {
    const product_code = document.getElementById("productCode").value.trim();
    const name = document.getElementById("productName").value.trim();
    const buy = Number(document.getElementById("buyPrice").value);
    const sell = Number(document.getElementById("sellPrice").value);
    const quantity = Number(document.getElementById("quantity").value);

    if (!product_code || !name || !buy || !sell || !quantity) {
        alert("⚠️ الرجاء إدخال جميع البيانات");
        return;
    }

    const { error } = await supabase
        .from("products")
        .insert([{ product_code, name, buy, sell, quantity }]);

    if (error) {
        alert("❌ حدث خطأ أثناء إضافة الصنف");
        console.log(error);
    } else {
        alert("✅ تم إضافة الصنف بنجاح");
    }
});
