import { supabase } from "../supabase.js";

// 🟡 دالة إنشاء باركود SKP تلقائي
async function generateNewBarcode() {
    const { data, error } = await supabase
        .from("products")
        .select("barcode")
        .order("id", { ascending: false })
        .limit(1);

    if (!data || data.length === 0) {
        return "SKP000001";
    }

    let lastBarcode = data[0].barcode;
    let num = parseInt(lastBarcode.replace("SKP", ""));
    let newNum = num + 1;

    return "SKP" + newNum.toString().padStart(6, "0");
}

// 🔵 تحميل باركود تلقائي عند فتح الصفحة
document.addEventListener("DOMContentLoaded", async () => {
    let bc = await generateNewBarcode();
    document.getElementById("barcode").value = bc;
});

// 🟢 دالة إضافة الصنف
window.addProduct = async function () {
    let code = document.getElementById("code").value.trim();
    let name = document.getElementById("name").value.trim();
    let buy = document.getElementById("buy").value.trim();
    let sell = document.getElementById("sell").value.trim();
    let qty = document.getElementById("qty").value.trim();
    let barcode = document.getElementById("barcode").value.trim();

    if (!code || !name || !buy || !sell || !qty) {
        alert("⚠️ الرجاء تعبئة كل البيانات");
        return;
    }

    const { error } = await supabase
        .from("products")
        .insert([{
            code: code,
            name: name,
            buy_price: buy,
            sell_price: sell,
            quantity: qty,
            barcode: barcode
        }]);

    if (error) {
        console.log(error);
        alert("❌ فشل إضافة الصنف");
    } else {
        alert("✅ تم إضافة الصنف بنجاح مع باركود: " + barcode);
        location.reload();
    }
}
