import { supabase } from "../supabase.js?v=1";

let customers = [];
let products = [];
let invoiceItems = [];

let scannerActive = false;
let video = document.getElementById("cameraPreview");

// ------------------------------
// تحميل العملاء
// ------------------------------
async function loadCustomers() {
    const { data, error } = await supabase.from("customers").select("*");

    let select = document.getElementById("customerSelect");
    select.innerHTML = "<option value=''>اختر العميل</option>";

    if (error) {
        console.log(error);
        alert("خطأ في تحميل العملاء");
        return;
    }

    customers = data;

    data.forEach(c => {
        select.innerHTML += `
            <option value="${c.id}">
                ${c.name} — ${c.phone}
            </option>`;
    });
}

// ------------------------------
// تحميل المنتجات
// ------------------------------
async function loadProducts() {
    const { data, error } = await supabase.from("products").select("*");

    let select = document.getElementById("productSelect");
    select.innerHTML = "<option value=''>اختر المنتج</option>";

    if (error) {
        console.log(error);
        alert("خطأ في تحميل المنتجات");
        return;
    }

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

// ------------------------------
// مسح الباركود بالكاميرا
// ------------------------------
import('https://cdn.jsdelivr.net/npm/@zxing/library@latest').then(lib => {
    const { BrowserMultiFormatReader } = lib;
    const codeReader = new BrowserMultiFormatReader();

    document.getElementById("scanBtn").addEventListener("click", async () => {
        if (scannerActive) {
            codeReader.reset();
            video.style.display = "none";
            scannerActive = false;
            return;
        }

        scannerActive = true;
        video.style.display = "block";

        const devices = await navigator.mediaDevices.enumerateDevices();
        const camera = devices.find(d => d.kind === "videoinput");

        if (!camera) {
            alert("لا يوجد كاميرا!");
            return;
        }

        codeReader.decodeFromVideoDevice(
            camera.deviceId,
            video,
            (result, err) => {
                if (result) {
                    let barcode = result.text;
                    console.log("Barcode:", barcode);
                    scannerActive = false;
                    video.style.display = "none";
                    codeReader.reset();

                    selectProductByBarcode(barcode);
                }
            }
        );
    });
});

// ------------------------------
// اختيار المنتج أوتوماتيكياً بعد مسح الباركود
// ------------------------------
function selectProductByBarcode(barcode) {
    let select = document.getElementById("productSelect");

    for (let i = 0; i < select.options.length; i++) {
        if (select.options[i].dataset.code === barcode) {
            select.selectedIndex = i;
            addItem();
            return;
        }
    }

    alert("❌ الباركود غير موجود في المنتجات");
}

// ------------------------------
// البحث اليدوي بالباركود (اختياري)
// ------------------------------
document.getElementById("barcodeInput").addEventListener("input", function () {
    let code = this.value.trim();
    let select = document.getElementById("productSelect");

    if (!code) {
        select.selectedIndex = 0;
        return;
    }

    for (let i = 0; i < select.options.length; i++) {
        if (select.options[i].dataset.code === code) {
            select.selectedIndex = i;
            break;
        }
    }
});

// ------------------------------
// إضافة صنف للفاتورة
// ------------------------------
window.addItem = function () {
    let select = document.getElementById("productSelect");
    let productId = select.value;

    if (!productId) {
        alert("⚠️ اختر المنتج");
        return;
    }

    let name = select.options[select.selectedIndex].dataset.name;
    let price = Number(select.options[select.selectedIndex].dataset.price);
    let code = select.options[select.selectedIndex].dataset.code;

    let qty = Number(document.getElementById("qty").value) || 1;
    let discount = Number(document.getElementById("discount").value) || 0;

    let total = (price * qty) - discount;

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

// ------------------------------
// عرض الأصناف داخل الجدول
// ------------------------------
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

// ------------------------------
// حذف صنف
// ------------------------------
window.removeItem = function (index) {
    invoiceItems.splice(index, 1);
    renderTable();
};

// ------------------------------
// حفظ الفاتورة في Supabase
// ------------------------------
window.saveInvoice = async function () {
    let customerId = document.getElementById("customerSelect").value;

    if (!customerId) {
        return alert("⚠️ اختر العميل قبل الحفظ");
    }

    if (invoiceItems.length === 0) {
        return alert("⚠️ لا توجد أصناف");
    }

    // إنشاء فاتورة جديدة
    const { data, error } = await supabase
        .from("sales_invoices")
        .insert([{ customer_id: customerId, created_at: new Date() }])
        .select();

    if (error) {
        console.log(error);
        alert("خطأ في حفظ الفاتورة");
        return;
    }

    let invoiceId = data[0].id;

    // حفظ تفاصيل الأصناف
    for (const item of invoiceItems) {
        await supabase.from("sales").insert([{
            invoice_id: invoiceId,
            product_id: item.product_id,
            qty: item.qty,
            price: item.price,
            discount: item.discount,
            total: item.total
        }]);
    }

    alert("✅ تم حفظ الفاتورة بنجاح");
    window.location.href = `sales_invoice.html?id=${invoiceId}`;
};

// تحميل البيانات عند فتح الصفحة
loadCustomers();
loadProducts();
