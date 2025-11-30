<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>العملاء | SmartKey Pro</title>

<style>
    body {
        background:#000;
        color:#fff;
        font-family:Tajawal, sans-serif;
        padding:20px;
    }
    h2 {
        color:gold;
        text-align:center;
        margin-bottom:20px;
    }
    input {
        width:95%;
        padding:10px;
        margin:5px 0;
        border-radius:8px;
        border:1px solid gold;
        background:#111;
        color:#fff;
        font-size:16px;
    }
    button {
        background:gold;
        color:#000;
        padding:10px 20px;
        border:none;
        border-radius:8px;
        cursor:pointer;
        font-weight:bold;
        font-size:16px;
        margin-top:10px;
    }
    table {
        width:100%;
        margin-top:20px;
        border-collapse:collapse;
        font-size:16px;
    }
    th, td {
        border:1px solid gold;
        padding:10px;
        text-align:center;
    }
    th {
        background:#222;
        color:gold;
    }
</style>
</head>

<body>

<h2>إضافة عميل جديد</h2>

<div style="background:#111; border:1px solid gold; padding:15px; border-radius:10px;">
    <label>اسم العميل:</label>
    <input type="text" id="customerName">

    <label>رقم الجوال:</label>
    <input type="text" id="customerPhone">

    <button id="saveCustomer">➕ حفظ العميل</button>
</div>

<h2>قائمة العملاء</h2>

<table id="customersTable">
    <thead>
        <tr>
            <th>الاسم</th>
            <th>الجوال</th>
        </tr>
    </thead>
    <tbody></tbody>
</table>


<script type="module">
/* ================= Supabase ================= */
import { supabase } from "../supabase.js";

/* ========== إضافة عميل ========== */
document.getElementById("saveCustomer").onclick = async () => {
    const name = document.getElementById("customerName").value.trim();
    const phone = document.getElementById("customerPhone").value.trim();

    if (!name || !phone) {
        alert("⚠️ الرجاء إدخال الاسم ورقم الجوال");
        return;
    }

    const { data, error } = await supabase
        .from("customers")
        .insert([{ name, phone, balance: 0 }]);

    console.log("Insert result:", data, error);

    if (error) {
        alert("❌ فشل الحفظ");
        console.error(error);
    } else {
        alert("✅ تم إضافة العميل");
        loadCustomers();
    }
};

/* ========== تحميل العملاء ========== */
async function loadCustomers() {
    const { data, error } = await supabase
        .from("customers")
        .select("*")
        .order("created_at", { ascending: false });

    console.log("Customers:", data, error);

    const tbody = document.querySelector("#customersTable tbody");
    tbody.innerHTML = "";

    if (data) {
        data.forEach(c => {
            tbody.innerHTML += `
                <tr>
                    <td>${c.name}</td>
                    <td>${c.phone}</td>
                </tr>
            `;
        });
    }
}

/* تشغيل التحميل عند فتح الصفحة */
loadCustomers();

</script>

</body>
</html>
