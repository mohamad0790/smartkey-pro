import { supabase } from "../supabase.js";

/* ================ تحميل المنتجات ================ */
async function loadProducts() {
    const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("id", { ascending: false });

    if (error) {
        console.error("خطأ في تحميل المنتجات:", error);
        return;
    }

    const table = document.getElementById("productsTableBody");
    table.innerHTML = "";

    data.forEach((item) => {
        const row = document.createElement("tr");

        row.innerHTML = `
            <td><img class="product-img" src="${item.image_url || "../img/no-image.png"}" /></td>
            <td>${item.product_code}</td>
            <td>${item.name}</td>
            <td>${item.buy_price || "-"}</td>
            <td>${item.sell_price || "-"}</td>
            <td>${item.quantity || 0}</td>
            <td>${new Date(item.created_at).toLocaleDateString("ar-EG")}</td>
        `;

        table.appendChild(row);
    });
}

/* ================ معاينة الصورة قبل الرفع ================ */
const fileInput = document.getElementById("imageFile");
const preview = document.getElementById("preview");

fileInput.addEventListener("change", () => {
    const file = fileInput.files[0];
    if (file) {
        preview.src = URL.createObjectURL(file);
        preview.style.display = "block";
    }
});

/* ================ رفع الصورة إلى Supabase ================ */
async function uploadImage(file) {
    if (!file) return null;

    const fileName = `${Date.now()}_${file.name}`;
    const { data, error } = await supabase.storage
        .from("images")
        .upload(fileName, file);

    if (error) {
        console.error("خطأ في رفع الصورة:", error);
        return null;
    }

    const url = `https://qvnxhqqewluqcdddltiw.supabase.co/storage/v1/object/public/images/${fileName}`;
    return url;
}

/* ================ إضافة صنف جديد ================ */
window.addProduct = async function () {
    const product_code = document.getElementById("product_code").value.trim();
    const name = document.getElementById("name").value.trim();
    const buy = document.getElementById("buy").value.trim();
    const sell = document.getElementById("sell").value.trim();
    const quantity = document.getElementById("quantity").value.trim();
    const file = document.getElementById("imageFile").files[0];

    if (!product_code || !name) {
        alert("❗ يجب إدخال كود الصنف واسم الصنف");
        return;
    }

    let image_url = null;

    if (file) {
        image_url = await uploadImage(file);
    }

    const { data, error } = await supabase.from("products").insert([
        {
            product_code,
            name,
            buy_price: buy || null,
            sell_price: sell || null,
            quantity: quantity || 0,
            image_url,
        },
    ]);

    if (error) {
        console.error("خطأ في إضافة الصنف:", error);
        alert("⚠ حدث خطأ أثناء إضافة الصنف");
        return;
    }

    alert("✔ تم إضافة الصنف بنجاح");
    loadProducts();
};

/* ================ البحث عن صنف ================ */
document.getElementById("search").addEventListener("input", async (e) => {
    const searchText = e.target.value.trim();

    const { data } = await supabase
        .from("products")
        .select("*")
        .ilike("name", `%${searchText}%`);

    const table = document.getElementById("productsTableBody");
    table.innerHTML = "";

    data.forEach((item) => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td><img class="product-img" src="${item.image_url || "../img/no-image.png"}" /></td>
            <td>${item.product_code}</td>
            <td>${item.name}</td>
            <td>${item.buy_price || "-"}</td>
            <td>${item.sell_price || "-"}</td>
            <td>${item.quantity || 0}</td>
            <td>${new Date(item.created_at).toLocaleDateString("ar-EG")}</td>
        `;
        table.appendChild(row);
    });
});

/* ================ تشغيل تحميل المنتجات أول ما تفتح الصفحة ================ */
loadProducts();
