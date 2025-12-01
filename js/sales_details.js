import { supabase } from "../supabase.js?v=1";

let customers = [];
let products = [];
let invoiceItems = [];

// زر الفيديو
let scannerActive = false;
let video = document.getElementById("cameraPreview");

// تحميل العملاء
async function loadCustomers() {
    const { data, error } = await supabase.from("customers").select("*");

    let select = document.getElementById("customerSelect");
    select.innerHTML = "<option value=''>اختر العميل</option>";

    if (error) return alert("خطأ في تحميل العملاء");

    customers = data;

    data.forEach(c => {
        select.innerHTML += `<option value="${c.id}">${c.name} — ${c.phone}</option>`;
    });
}

// تحميل المنتجات
async function loadProducts() {
    const { data, error } = await supabase.from("products").select("*");

    let select = document.getElementById("productSelect");
    select.innerHTML = "<option value=''>اختر المنتج</option>";

    if (error) return alert("خطأ في تحميل المنتجات");

    products = data;

    data.forEach(p => {
        select.innerHTML += `
            <option value="${p.id}" 
                    data-name="${p.name}" 
                    data-price="${p.sell}" 
                    data-code="${p.product_code}">
                ${p.product_code} — ${p.name} — (${p.sell} ريال)
            </option>`;
    });
}

/* 🔥 ماسح الباركود — النسخة الصحيحة التي تعمل 100% بدون exports خطأ */
import { BrowserMultiFormatReader } 
from "https://cdn.jsdelivr.net/npm/@zxing/library@0.18.6/esm/index.js";

const reader = new BrowserMultiFormatReader();

document.getElementById("scanBtn").addEventListener("click", async () => {

    if (scannerActive) {
        reader.reset();
        video.style.display = "none";
        scannerActive = false;
        return;
    }

    scannerActive = true;
    video.style.display = "block";

    const devices = await navigator.mediaDevices.enumerateDevices();
    const camera = devices.find(d => d.kind === "videoinput");

    reader.decodeFromVideoDevice(camera.deviceId, video, (result, err) => {
        if (result) {
            let barcode = result.text;

            reader.reset();
            video.style.display = "none";
            scannerActive = false;

            selectProductByBarcode(barcode);
        }
    });
});

// اختيار المنتج بعد قراءة الباركود
function selectProductByBarcode(barcode) {
    let select = document.getElementById("productSelect");

    for (let i = 0; i < select.options.length; i++) {
        if (select.options[i].dataset.code === barcode) {
            select.selectedIndex = i;
            addItem();
            return;
        }
    }

    alert("❌ الباركود غير موجود");
}

// إضافة صنف
window.addItem = function () {
    let select = document.getElementById("productSelect");
    let productId = select.value;

    if (!productId) return alert("اختر المنتج");

    let name = select.options[select.selectedIndex].dataset.name;
    let price = Number(select.options[select.selectedIndex].dataset.price);
    let code = select.options[select.selectedIndex].dataset.code;

    let qty = Number(document.getElementById("qty").value) || 1;
    let discount = Number(document.getElementById("discount").value) || 0;

    let total = price * qty - discount;

    invoiceItems.push({
        product_id: productId,
        product_code: code,
        name,
        qty,
        price,
        discount,
        total
    });

    renderTable();
};

// عرض الجدول
function renderTable() {
    let table = document.getElementById("itemsTable");
    table.innerHTML = "";

    let final = 0;

    invoiceItems.forEach((item, index) => {
        final += item.total;

        table.innerHTML += `
            <tr>
                <td>${item.product_code}</td>
                <td>${item.qty}</td>
                <td>${item.price}</td>
                <td>${item.total}</td>
                <td><button class="delete-btn" onclick="removeItem(${index})">❌</button></td>
            </tr>
        `;
    });

    document.getElementById("totalFinal").textContent = final;
}

// حذف صنف
window.removeItem = function (index) {
    invoiceItems.splice(index, 1);
    renderTable();
};

// حفظ الفاتورة
window.saveInvoice = async function () {
    let customerId = document.getElementById("customerSelect").value;

    if (!customerId) return alert("اختر العميل");

    if (invoiceItems.length === 0) return alert("لا توجد أصناف");

    const { data, error } = await supabase
        .from("sales_invoices")
        .insert([{ customer_id: customerId, created_at: new Date() }])
        .select();

    let invoiceId = data[0].id;

    for (let item of invoiceItems) {
        await supabase.from("sales").insert([{
            invoice_id: invoiceId,
            product_id: item.product_id,
            qty: item.qty,
            price: item.price,
            discount: item.discount,
            total: item.total
        }]);
    }

    alert("تم حفظ الفاتورة");
    window.location.href = `sales_invoice.html?id=${invoiceId}`;
};

// تشغيل
loadCustomers();
loadProducts();
