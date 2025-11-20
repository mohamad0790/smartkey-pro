// ========= إعداد Supabase ==========
const SUPABASE_URL = "https://qvnxhqqewluqcdddltiw.supabase.co";
const SUPABASE_KEY = "EYJHBGCI... (اكتب المفتاح الكامل هنا)";
const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ========= عناصر HTML ==========
const form = document.getElementById("addForm");
const table = document.getElementById("productTable");

// ========= إضافة صنف ==========
form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("name").value;
    const code = document.getElementById("code").value;
    const buy = document.getElementById("buy").value;
    const sell = document.getElementById("sell").value;

    const { data, error } = await db
        .from("products")
        .insert([{ name, code, buy_price: buy, sell_price: sell }]);

    if (error) {
        alert("خطأ أثناء الإضافة: " + error.message);
        return;
    }

    alert("✔️ تم إضافة الصنف بنجاح");
    form.reset();
    loadProducts();
});

// ========= تحميل الأصناف ==========
async function loadProducts() {
    const { data, error } = await db.from("products").select("*");

    table.innerHTML = "";

    data.forEach((item) => {
        table.innerHTML += `
        <tr>
            <td>${item.code}</td>
            <td>${item.name}</td>
            <td>${item.buy_price}</td>
            <td>${item.sell_price}</td>
            <td><button class="del-btn" onclick="del(${item.id})">🗑 حذف</button></td>
        </tr>
        `;
    });
}

// ========= حذف صنف ==========
async function del(id) {
    const sure = confirm("هل أنت متأكد من حذف الصنف؟");
    if (!sure) return;

    const { error } = await db.from("products").delete().eq("id", id);

    if (error) {
        alert("خطأ أثناء الحذف");
        return;
    }

    loadProducts();
}

// تحميل البيانات عند فتح الصفحة
loadProducts();
