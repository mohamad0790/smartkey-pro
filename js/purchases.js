import { supabase } from "../supabase.js";

let uploadedImageUrl = null;

// تحميل الموردين
window.onload = () => {
    loadSuppliers();
};

async function loadSuppliers() {
    const { data } = await supabase.from("suppliers").select("*");
    const sel = document.getElementById("supplier");

    data?.forEach(s => {
        sel.innerHTML += `<option value="${s.id}">${s.name}</option>`;
    });
}

// رفع الصورة إلى Storage
async function uploadImage(file, code) {
    if (!file) return null;

    const fileExt = file.name.split(".").pop();
    const fileName = `${code}_${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    let { error: uploadError } = await supabase.storage
        .from("images")
        .upload(filePath, file, { upsert: true });

    if (uploadError) {
        console.log(uploadError);
        alert("خطأ في رفع الصورة");
        return null;
    }

    const { data } = supabase.storage
        .from("images")
        .getPublicUrl(filePath);

    return data.publicUrl;
}

// المعاينة
document.getElementById("imageFile").onchange = function (e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
        document.getElementById("preview").src = reader.result;
        document.getElementById("preview").style.display = "block";
    };
    reader.readAsDataURL(file);
};

// تحديث الإجمالي
["buy", "qty"].forEach(id => {
    document.getElementById(id).oninput = () => {
        const buy = Number(document.getElementById("buy").value);
        const qty = Number(document.getElementById("qty").value);
        document.getElementById("total").textContent = buy * qty || 0;
    };
});

// حفظ المشتريات
window.savePurchase = async function () {
    const supplier_id = document.getElementById("supplier").value;
    const code = document.getElementById("code").value.trim();
    const name = document.getElementById("name").value.trim();
    const buy = Number(document.getElementById("buy").value);
    const qty = Number(document.getElementById("qty").value);
    const imageFile = document.getElementById("imageFile").files[0];

    if (!supplier_id || !code || !name || buy <= 0 || qty <= 0) {
        return alert("⚠️ الرجاء تعبئة جميع البيانات");
    }

    // 1) رفع الصورة أولاً
    let image_url = null;

    if (imageFile) {
        image_url = await uploadImage(imageFile, code);
    }

    // 2) جلب المنتج إن وجد
    const { data: existingProduct } = await supabase
        .from("products")
        .select("*")
        .eq("product_code", code)
        .single();

    let product_id;

    if (!existingProduct) {
        // إنشاء منتج جديد
        const { data: newProd, error } = await supabase
            .from("products")
            .insert([
                {
                    product_code: code,
                    name: name,
                    buy: buy,
                    sell: buy + 5, // سعر افتراضي مؤقت
                    quantity: qty,
                    image_url: image_url
                }
            ])
            .select()
            .single();

        product_id = newProd.id;
    } else {
        // تحديث المنتج الموجود
        product_id = existingProduct.id;

        await supabase
            .from("products")
            .update({
                buy: buy,
                quantity: existingProduct.quantity + qty,
                image_url: image_url || existingProduct.image_url
            })
            .eq("id", existingProduct.id);
    }

    // 3) إنشاء فاتورة مشتريات
    const total = buy * qty;

    const { data: pur } = await supabase
        .from("purchases")
        .insert([
            {
                supplier_id,
                total
            }
        ])
        .select()
        .single();

    // 4) إضافة عنصر الفاتورة
    await supabase.from("purchase_items").insert([
        {
            purchase_id: pur.id,
            product_id: product_id,
            qty,
            buy_price: buy
        }
    ]);

    alert("✔ تم حفظ المشتريات بنجاح");
    window.location.reload();
};
