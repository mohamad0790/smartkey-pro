import { supabase } from "../supabase.js";

/* ============= عناصر HTML ============= */
const customerSelect = document.getElementById("customerSelect");
const invoiceTableBody = document.getElementById("invoiceTableBody");
const barcodeInput = document.getElementById("barcodeInput");
const productNameInput = document.getElementById("productNameInput");
const productQty = document.getElementById("productQty");

const totalNoTax = document.getElementById("totalNoTax");
const discountInput = document.getElementById("discountInput");
const finalTotal = document.getElementById("finalTotal");
const paidAmount = document.getElementById("paidAmount");
const remainingAmount = document.getElementById("remainingAmount");

const video = document.getElementById("video");
const cameraBox = document.getElementById("cameraBox");

let invoiceItems = [];  
let scanning = false;

/* ============= تحميل العملاء ============= */
async function loadCustomers() {
    const { data } = await supabase.from("customers").select("*").order("name");
    data?.forEach(c => {
        customerSelect.innerHTML += `<option value="${c.id}">${c.name}</option>`;
    });
}
loadCustomers();

/* ============= البحث عن المنتج (product_code) ============= */
async function findProduct(keyword) {
    const { data } = await supabase
        .from("products")
        .select("*")
        .or(`product_code.eq.${keyword},name.ilike.%${keyword}%`)
        .limit(1);

    return data?.length ? data[0] : null;
}

/* ============= إضافة صنف للفاتورة ============= */
window.addItemToInvoice = async function () {
    const keyword = barcodeInput.value.trim() || productNameInput.value.trim();
    const qty = Number(productQty.value);

    if (!keyword) return alert("اكتب الباركود أو الاسم");
    if (qty <= 0) return alert("كمية غير صحيحة");

    const product = await findProduct(keyword);
    if (!product) return alert("المنتج غير موجود");

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

    barcodeInput.value = "";
    productNameInput.value = "";
    renderInvoice();
};

/* ============= رسم جدول الفاتورة ============= */
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
        </tr>`;
    });

    totalNoTax.textContent = total;

    const discount = Number(discountInput.value) || 0;
    const final = total - discount;
    finalTotal.textContent = final;

    const paid = Number(paidAmount.value) || 0;
    remainingAmount.textContent = final - paid;
}

/* ============= حذف صنف ============= */
window.deleteItem = function (index) {
    invoiceItems.splice(index, 1);
    renderInvoice();
};

/* تحديث الحقول أثناء الكتابة */
discountInput.addEventListener("input", renderInvoice);
paidAmount.addEventListener("input", renderInvoice);

/* ============= جلب رصيد العميل السابق ============= */
async function getCustomerBalance(id) {
    const { data } = await supabase
        .from("customers")
        .select("balance")
        .eq("id", id)
        .single();
    return data ? Number(data.balance) : 0;
}

/* ============= حفظ الفاتورة ============= */
window.saveInvoice = async function () {
    if (invoiceItems.length === 0) return alert("الفاتورة فارغة");

    const customerId = customerSelect.value;
    const total = Number(finalTotal.textContent);
    const paid = Number(paidAmount.value) || 0;
    const remaining = total - paid;

    const oldBalance = await getCustomerBalance(customerId);
    const newBalance = oldBalance + remaining;

    const { data: saleData, error } = await supabase
        .from("sales")
        .insert({
            customer_id: customerId,
            total,
            paid,
            remaining,
            previous_balance: oldBalance,
            new_balance: newBalance
        })
        .select()
        .single();

    if (error) return alert("خطأ في حفظ الفاتورة");

    const saleId = saleData.id;

    // حفظ التفاصيل + تنزيل المخزون
    for (let item of invoiceItems) {
        await supabase.from("sale_items").insert({
            sale_id: saleId,
            product_id: item.id,
            qty: item.qty,
            price: item.price,
            total: item.qty * item.price
        });

        await supabase
            .from("products")
            .update({ quantity: supabase.sql`quantity - ${item.qty}` })
            .eq("id", item.id);
    }

    // تحديث رصيد العميل
    await supabase.from("customers")
        .update({ balance: newBalance })
        .eq("id", customerId);

    alert("تم حفظ الفاتورة بنجاح!");
    invoiceItems = [];
    renderInvoice();
};

/* ============= تشغيل ماسح الباركود ============= */
window.startScan = async function () {
    cameraBox.style.display = "block";

    const codeReader = new ZXing.BrowserMultiFormatReader();
    scanning = true;

    codeReader.decodeFromVideoDevice(null, "video", (result, err) => {
        if (result && scanning) {
            barcodeInput.value = result.text;
            stopScan();
        }
    });
};

/* ============= إيقاف الماسح ============= */
window.stopScan = function () {
    scanning = false;
    cameraBox.style.display = "none";

    const stream = video.srcObject;
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
    }
    video.srcObject = null;
};
