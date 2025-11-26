import { supabase } from "../supabase.js";

/* ----------------------------
   عناصر HTML
---------------------------- */
const customerSelect = document.getElementById("customerSelect");
const invoiceTableBody = document.getElementById("invoiceTableBody");
const barcodeInput = document.getElementById("barcodeInput");
const productNameInput = document.getElementById("productNameInput");
const productQty = document.getElementById("productQty");
const paidAmount = document.getElementById("paidAmount");

const totalNoTax = document.getElementById("totalNoTax");
const finalTotal = document.getElementById("finalTotal");
const remainingAmount = document.getElementById("remainingAmount");

let invoiceItems = []; // السلة

/* --------------------------------
    تحميل العملاء
-------------------------------- */
async function loadCustomers() {
    const { data, error } = await supabase.from("customers").select("*").order("name");

    customerSelect.innerHTML = "";

    if (data && data.length > 0) {
        data.forEach(c => {
            customerSelect.innerHTML += `<option value="${c.id}">${c.name}</option>`;
        });
    }
}

loadCustomers();

/* --------------------------------
    دالة البحث عن المنتج
-------------------------------- */
async function findProduct(keyword) {
    const { data, error } = await supabase
        .from("products")
        .select("*")
        .or(`barcode.eq.${keyword},product_code.eq.${keyword},name.ilike.%${keyword}%`)
        .limit(1);

    if (data && data.length > 0) return data[0];
    return null;
}

/* --------------------------------
    إضافة منتج للفاتورة
-------------------------------- */
window.addItemToInvoice = async function () {
    const keyword = barcodeInput.value.trim() || productNameInput.value.trim();
    const qty = Number(productQty.value);

    if (!keyword) return alert("اكتب الباركود أو اسم المنتج");
    if (qty <= 0) return alert("الكمية غير صحيحة");

    const product = await findProduct(keyword);

    if (!product) return alert("المنتج غير موجود!");

    // إضافة للسلة
    const exist = invoiceItems.find(i => i.id === product.id);
    if (exist) {
        exist.qty += qty;
    } else {
        invoiceItems.push({
            id: product.id,
            name: product.name,
            price: Number(product.sell),
            qty: qty
        });
    }

    renderInvoice();
    barcodeInput.value = "";
    productNameInput.value = "";
};

/* --------------------------------
    رسم جدول الفاتورة
-------------------------------- */
function renderInvoice() {
    invoiceTableBody.innerHTML = "";

    let total = 0;

    invoiceItems.forEach((item, index) => {
        const rowTotal = item.qty * item.price;
        total += rowTotal;

        invoiceTableBody.innerHTML += `
            <tr>
                <td>${item.name}</td>
                <td>${item.price}</td>
                <td>${item.qty}</td>
                <td>${rowTotal}</td>
                <td><button class="delete-btn" onclick="deleteItem(${index})">حذف</button></td>
            </tr>
        `;
    });

    totalNoTax.textContent = total;
    finalTotal.textContent = total;

    const paid = Number(paidAmount.value) || 0;
    remainingAmount.textContent = finalTotal.textContent - paid;
}

/* --------------------------------
    حذف صنف من الفاتورة
-------------------------------- */
window.deleteItem = function (index) {
    invoiceItems.splice(index, 1);
    renderInvoice();
};

/* --------------------------------
    تحديث المتبقي عند إدخال مبلغ مدفوع
-------------------------------- */
paidAmount.addEventListener("input", renderInvoice);

/* --------------------------------
    جلب رصيد العميل السابق
-------------------------------- */
async function getCustomerBalance(customerId) {
    const { data, error } = await supabase
        .from("customers")
        .select("balance")
        .eq("id", customerId)
        .single();

    return data ? Number(data.balance) : 0;
}

/* --------------------------------
    حفظ الفاتورة
-------------------------------- */
window.saveInvoice = async function () {
    if (invoiceItems.length === 0) return alert("الفاتورة فارغة!");

    const customerId = customerSelect.value;
    const total = Number(finalTotal.textContent);
    const paid = Number(paidAmount.value) || 0;
    const remaining = total - paid;

    // استخراج رصيد العميل السابق:
    const oldBalance = await getCustomerBalance(customerId);
    const newBalance = oldBalance + remaining;

    // 1) حفظ الفاتورة في جدول sales
    const { data: saleData, error: saleError } = await supabase
        .from("sales")
        .insert({
            customer_id: customerId,
            total: total,
            paid: paid,
            remaining: remaining,
            previous_balance: oldBalance,
            new_balance: newBalance
        })
        .select()
        .single();

    if (saleError) return alert("خطأ في حفظ الفاتورة");

    const saleId = saleData.id;

    // 2) حفظ تفاصيل الأصناف في sale_items
    for (let item of invoiceItems) {
        await supabase.from("sale_items").insert({
            sale_id: saleId,
            product_id: item.id,
            qty: item.qty,
            price: item.price,
            total: item.qty * item.price
        });

        // 3) تنزيل الكمية من المخزون
        await supabase.rpc("decrease_stock", {
            p_id: item.id,
            p_qty: item.qty
        });
    }

    // 4) تحديث رصيد العميل
    await supabase
        .from("customers")
        .update({ balance: newBalance })
        .eq("id", customerId);

    alert("تم حفظ الفاتورة بنجاح!");
    invoiceItems = [];
    renderInvoice();
};
