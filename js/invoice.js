import { supabase } from "../supabase.js";

/* =========================================================
    1) تحميل العملاء عند فتح الصفحة
========================================================= */
async function loadCustomers() {
    const { data, error } = await supabase
        .from("customers")
        .select("*")
        .order("id", { ascending: false });

    if (error) {
        console.error("خطأ تحميل العملاء:", error);
        return;
    }

    const select = document.getElementById("customerSelect");
    select.innerHTML = `<option value="">— اختر العميل —</option>`;

    data.forEach(cust => {
        let op = document.createElement("option");
        op.value = cust.id;
        op.innerText = cust.name + " | " + cust.phone;
        select.appendChild(op);
    });
}

/* =========================================================
    2) البحث عن صنف بالاسم / الكود / الباركود
========================================================= */
async function findProduct(keyword) {
    if (!keyword) return null;

    const { data, error } = await supabase
        .from("products")
        .select("*")
        .or(
            `product_code.eq.${keyword}, name.ilike.%${keyword}%, barcode.eq.${keyword}`
        )
        .limit(1);

    if (error) {
        console.error("خطأ البحث:", error);
        return null;
    }

    return data.length ? data[0] : null;
}

/* =========================================================
    3) إضافة صنف إلى الفاتورة
========================================================= */
let invoiceItems = [];

window.addItemToInvoice = async function () {
    const keyword = document.getElementById("barcodeInput").value.trim()
        || document.getElementById("productNameInput").value.trim();
    const qty = parseInt(document.getElementById("productQty").value);

    if (!keyword) {
        alert("❗ أدخل اسم أو كود أو باركود الصنف");
        return;
    }

    const product = await findProduct(keyword);

    if (!product) {
        alert("❗ الصنف غير موجود في المخزون");
        return;
    }

    invoiceItems.push({
        id: product.id,
        name: product.name,
        price: product.sell_price,
        qty: qty,
        total: product.sell_price * qty
    });

    renderInvoiceTable();
    calculateTotals();
};

/* =========================================================
    4) تحديث جدول الفاتورة
========================================================= */
function renderInvoiceTable() {
    const body = document.getElementById("invoiceTableBody");
    body.innerHTML = "";

    invoiceItems.forEach((item, index) => {
        let row = `
            <tr>
                <td>${item.name}</td>
                <td>${item.price}</td>
                <td>${item.qty}</td>
                <td>${item.total}</td>
                <td><button class="delete-btn" onclick="deleteItem(${index})">✖</button></td>
            </tr>
        `;
        body.innerHTML += row;
    });
}

window.deleteItem = function (index) {
    invoiceItems.splice(index, 1);
    renderInvoiceTable();
    calculateTotals();
};

/* =========================================================
    5) حساب الإجماليات + الضريبة + المتبقي
========================================================= */
function calculateTotals() {
    let total = invoiceItems.reduce((sum, item) => sum + item.total, 0);
    document.getElementById("totalNoTax").innerText = total;

    let tax = 0;
    if (document.getElementById("taxCheck").checked) {
        tax = total * 0.15;
    }
    document.getElementById("taxAmount").innerText = Math.round(tax);

    let finalTotal = total + tax;
    document.getElementById("finalTotal").innerText = Math.round(finalTotal);

    let paid = parseFloat(document.getElementById("paidAmount").value || 0);
    let remain = finalTotal - paid;

    document.getElementById("remainingAmount").innerText = Math.round(remain);
}

/* تحديث الإجماليات مع كل تغيير */
document.getElementById("paidAmount").addEventListener("input", calculateTotals);
document.getElementById("taxCheck").addEventListener("change", calculateTotals);

/* =========================================================
    6) حفظ الفاتورة داخل Supabase
========================================================= */
window.saveInvoice = async function () {
    if (!invoiceItems.length) {
        alert("❗ لا يوجد أصناف في الفاتورة");
        return;
    }

    const customer_id = document.getElementById("customerSelect").value || null;
    const total = parseFloat(document.getElementById("finalTotal").innerText);
    const paid = parseFloat(document.getElementById("paidAmount").value || 0);
    const remain = total - paid;

    // 1) حفظ الفاتورة
    const { data: invoice, error: invErr } = await supabase
        .from("invoices")
        .insert([
            { customer_id, total_amount: total, paid_amount: paid, remaining_amount: remain }
        ])
        .select();

    if (invErr) {
        console.error("خطأ حفظ الفاتورة:", invErr);
        alert("⚠ حدث خطأ أثناء حفظ الفاتورة");
        return;
    }

    const invoice_id = invoice[0].id;

    // 2) حفظ أصناف الفاتورة
    for (let item of invoiceItems) {
        await supabase
            .from("invoice_items")
            .insert([
                {
                    invoice_id,
                    product_id: item.id,
                    quantity: item.qty,
                    price: item.price,
                    total: item.total
                }
            ]);

        // 3) خصم الكمية من المخزون
        await supabase.rpc("decrease_stock", {
            product_id_input: item.id,
            qty_input: item.qty
        });
    }

    alert("✔ تم حفظ الفاتورة بنجاح");
    invoiceItems = [];
    renderInvoiceTable();
    calculateTotals();
};

/* =========================================================
    7) إضافة عميل جديد
========================================================= */
window.addNewCustomer = async function () {
    let name = prompt("اسم العميل:");
    let phone = prompt("رقم الجوال:");

    if (!name || !phone) return;

    await supabase.from("customers").insert([{ name, phone }]);
    loadCustomers();
};

/* =========================================================
    8) تشغيل الفاتورة عند الدخول
========================================================= */
loadCustomers();
