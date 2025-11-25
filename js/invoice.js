// ======================
// invoice.js – النسخة النهائية
// ======================

import { supabase } from "../supabase.js";

let customers = [];
let products = [];
let invoiceItems = [];

// عناصر HTML
const customerSelect = document.getElementById("customerSelect");
const barcodeInput = document.getElementById("barcodeInput");
const nameInput = document.getElementById("productNameInput");
const qtyInput = document.getElementById("productQty");
const invoiceTableBody = document.getElementById("invoiceTableBody");

const taxCheck = document.getElementById("taxCheck");
const totalNoTaxEl = document.getElementById("totalNoTax");
const taxAmountEl = document.getElementById("taxAmount");
const finalTotalEl = document.getElementById("finalTotal");
const paidAmountEl = document.getElementById("paidAmount");
const remainingAmountEl = document.getElementById("remainingAmount");

// ==============================
// 1️⃣ تحميل العملاء
// ==============================
async function loadCustomers() {
    const { data, error } = await supabase
        .from("customers")
        .select("*")
        .order("name");

    if (error) return console.error(error);

    customers = data;

    customerSelect.innerHTML = `<option value="">اختر عميل...</option>`;

    data.forEach(c => {
        customerSelect.innerHTML += `
            <option value="${c.id}">${c.name} — ${c.phone_number || ''}</option>
        `;
    });
}

// فتح صفحة إضافة عميل جديد
window.addNewCustomer = function () {
    window.location.href = "customer_add.html";
};

// ==============================
// 2️⃣ تحميل المنتجات
// ==============================
async function loadProducts() {
    const { data, error } = await supabase
        .from("products")
        .select("*");

    if (error) return console.error(error);

    products = data;
}

// ==============================
// 3️⃣ إضافة صنف للفاتورة
// ==============================
window.addItemToInvoice = function () {
    const code = barcodeInput.value.trim();
    const nameSearch = nameInput.value.trim();
    const qty = Number(qtyInput.value);

    if (qty <= 0) return alert("الكمية غير صحيحة");

    let product = null;

    if (code) {
        product = products.find(p => p.product_code == code);
    }
    if (!product && nameSearch) {
        product = products.find(p => p.name.includes(nameSearch));
    }

    if (!product) return alert("الصنف غير موجود");

    invoiceItems.push({
        id: product.id,
        name: product.name,
        price: product.sell,
        qty: qty,
        total: qty * product.sell
    });

    updateTable();
    calculateTotals();
};

// ==============================
// 4️⃣ تحديث جدول الفاتورة
// ==============================
function updateTable() {
    invoiceTableBody.innerHTML = "";

    invoiceItems.forEach((item, index) => {
        invoiceTableBody.innerHTML += `
            <tr>
                <td>${item.name}</td>
                <td>${item.price}</td>
                <td>${item.qty}</td>
                <td>${item.total}</td>
                <td>
                    <button class="delete-btn" onclick="removeItem(${index})">حذف</button>
                </td>
            </tr>
        `;
    });
}

// حذف عنصر
window.removeItem = function (index) {
    invoiceItems.splice(index, 1);
    updateTable();
    calculateTotals();
};

// ==============================
// 5️⃣ حساب الإجماليات
// ==============================
function calculateTotals() {
    const total = invoiceItems.reduce((sum, item) => sum + item.total, 0);

    totalNoTaxEl.textContent = total;

    let tax = 0;
    if (taxCheck.checked) tax = total * 0.15;

    taxAmountEl.textContent = tax.toFixed(2);

    const final = total + tax;
    finalTotalEl.textContent = final.toFixed(2);

    const paid = Number(paidAmountEl.value) || 0;
    const remaining = final - paid;

    remainingAmountEl.textContent = remaining.toFixed(2);
}

paidAmountEl.addEventListener("input", calculateTotals);
taxCheck.addEventListener("change", calculateTotals);

// ==============================
// 6️⃣ حفظ الفاتورة بالكامل
// ==============================
window.saveInvoice = async function () {
    if (!customerSelect.value) return alert("اختر العميل");
    if (invoiceItems.length === 0) return alert("أضف أصناف للفاتورة");

    const total_amount = Number(finalTotalEl.textContent);
    const paid_amount = Number(paidAmountEl.value) || 0;
    const remaining_amount = total_amount - paid_amount;

    // --- 1) حفظ الفاتورة الرئيسية ---
    const { data: invoiceData, error: invoiceError } = await supabase
        .from("sales_invoices")
        .insert({
            customer_id: customerSelect.value,
            total_amount,
            paid_amount,
            remaining_amount,
            seller_id: "owner",
        })
        .select()
        .single();

    if (invoiceError) return alert("خطأ في حفظ الفاتورة");

    const invoiceId = invoiceData.id;

    // --- 2) حفظ تفاصيل الفاتورة ---
    for (const item of invoiceItems) {
        await supabase.from("sale_items").insert({
            sale_id: invoiceId,
            product_id: item.id,
            quantity: item.qty,
            price: item.price
        });

        // --- 3) خصم الكمية من المخزون ---
        const product = products.find(p => p.id == item.id);
        const newQty = Number(product.quantity) - item.qty;

        await supabase
            .from("products")
            .update({ quantity: newQty })
            .eq("id", item.id);
    }

    // --- 4) تحديث رصيد العميل ---
    await supabase.from("customer_transactions").insert({
        customer_id: customerSelect.value,
        amount: remaining_amount,
        balance_after: remaining_amount,
        note: "فاتورة مبيعات"
    });

    alert("تم حفظ الفاتورة بنجاح");
    window.location.reload();
};

// ==============================
// تشغيل عند فتح الصفحة
// ==============================
loadCustomers();
loadProducts();
