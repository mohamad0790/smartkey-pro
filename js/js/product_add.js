import { supabase } from "../supabase.js";

let preview = document.getElementById("preview");
let imageFileInput = document.getElementById("imageFile");

// 📸 معاينة الصورة
imageFileInput.onchange = () => {
    const file = imageFileInput.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
        preview.src = reader.result;
        preview.style.display = "block";
    };
    reader.readAsDataURL(file);
};

// 📤 رفع الصورة إلى Supabase Storage
async function uploadImage(imageFile, code) {
    if (!imageFile) return null;

    const ext = imageFile.name.split(".").pop();
    const fileName = `${code}_${Date.now()}.${ext}`;

    const { error } = await supabase.storage
        .from("images")  // اسم البكت
        .upload(fileName, imageFile, { upsert: true });

    if (error) {
        alert("⚠️ خطأ في رفع الصورة");
        console.log(error);
        return null;
    }

    const { data } = supabase.storage
        .from("images")
        .getPublicUrl(fileName);

    return data.publicUrl;
}

// 🟡 إضافة الصنف
window.addProduct = async function () {
    const code = document.getElementById("code").value.trim();
    const name = document.getElementById("name").value.trim();
    const buy = Number(document.getElementById("buy").value);
    const sell = Number(document.getElementById("sell").value);
    const qty = Number(document.getElementById("qty").value);
    const imageFile = imageFileInput.files[0];

    if (!code || !name || buy <= 0 || sell <= 0 || qty <= 0) {
        return alert("⚠️ الرجاء تعبئة كل البيانات");
    }

    // رفع الصورة أولاً
    const image_url = await uploadImage(imageFile, code);

    // فحص إذا المنتج موجود مسبقاً
    let { data: exists } = await supabase
        .from("products")
        .select("*")
        .eq("product_code", code)
        .single();

    if (!exists) {
        // ➕ إضافة منتج جديد
        const { error } = await supabase
            .from("products")
            .insert([
                {
                    product_code: code,
                    name: name,
                    buy: buy,
                    sell: sell,
                    quantity: qty,
                    image_url: image_url
                }
            ]);

        if (error) {
            alert("⚠️ خطأ في إضافة المنتج");
            console.log(error);
            return;
        }
    } else {
        // 🔄 المنتج موجود → نزيد الكمية ونحدث البيانات
        const { error } = await supabase
            .from("products")
            .update({
                name: name,
                buy: buy,
                sell: sell,
                quantity: exists.quantity + qty,
                image_url: image_url || exists.image_url
            })
            .eq("id", exists.id);

        if (error) {
            alert("⚠️ خطأ في تحديث المنتج");
            console.log(error);
            return;
        }
    }

    alert("✔️ تم إضافة الصنف بنجاح");
    window.location.href = "/smartkey-pro/pages/products.html";
};
