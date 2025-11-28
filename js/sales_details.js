// تحميل العملاء
async function loadCustomers() {
    const { data } = await window.supabase.from("customers").select("*");
    const select = document.getElementById("customerSelect");
    select.innerHTML = "<option value=''>اختر العميل</option>";

    data.forEach(c => {
        const op = document.createElement("option");
        op.value = c.id;
        op.textContent = c.name;
        select.appendChild(op);
    });
}

// تحميل الأصناف
async function loadProducts() {
    const { data } = await window.supabase.from("products").select("*");
    const select = document.getElementById("productSelect");
    select.innerHTML = "<option value=''>اختر المنتج</option>";

    data.forEach(p => {
        const op = document.createElement("option");
        op.value = p.id;
        op.textContent = p.name;
        op.dataset.price = p.sell; // سعر البيع
        select.appendChild(op);
    });
}

// مصفوفة الفاتورة
let invoiceItems = [];

// إضافة صنف إلى الفاتورة
window.addItem = function () {
    const productSelect = document.getElementById("productSelect");
    const productId = productSelect.value;
    const productName = productSelect.options[productSelect.selectedIndex].textContent;
    const price = Number(productSelect.options[productSelect.selectedIndex].dataset.price);
    const qty = Number(document.getElementById("qty").value);
    const discount = Number(document.getElementById("discount").value) || 0;

    if (!productId || qty <= 0) {
        alert("⚠️ الرجاء اختيار منتج وإدخال كمية صحيحة");
        return;
    }

    const total = (price * qty) - discount;

    invoiceItems.push({
        product_id: productId,
        name: productName,
        qty,
        price,
        discount,
        total
    });

    renderTable();
};

// عرض الجدول
function renderTable() {
    const table = document.getElementById("itemsTable");
    table.innerHTML = "";

    let totalFinal = 0;

    invoiceItems.forEach((item, index) => {
        const row = `
            <tr>
                <td>${item.name}</td>
                <td>${item.qty}</td>
                <td>${item.price}</td>
                <td>${item.total}</td>
                <td><button onclick="removeItem(${index})">❌</button></td>
            </tr>
        `;
        table.innerHTML += row;
        totalFinal += item.total;
    });

    document.getElementById("totalFinal").textContent = totalFinal;
}

// حذف صنف
window.removeItem = function (index) {
    invoiceItems.splice(index, 1);
    renderTable();
};

// حفظ الفاتورة
window.saveInvoice = async function () {
    const customerId = document.getElementById("customerSelect").value;

    if (!customerId || invoiceItems.length === 0) {
        alert("⚠️ الرجاء اختيار العميل وإضافة أصناف");
        return;
    }

    // حفظ الفاتورة الأساسية
    const { data: invoice, error } = await window.supabase
        .from("sales_invoices")
        .insert([{ customer_id: customerId }])
        .select();

    if (error) {
        alert("❌ حدث خطأ أثناء حفظ الفاتورة");
        return;
    }

    const invoiceId = invoice[0].id;

    // حفظ تفاصيل الفاتورة
    for (const item of invoiceItems) {
        await window.supabase.from("sales").insert([
            {
                invoice_id: invoiceId,
                product_id: item.product_id,
                qty: item.qty,
                price: item.price,
                discount: item.discount,
                total: item.total
            }
        ]);
    }

    alert("✅ تم حفظ الفاتورة بنجاح");
    window.location.reload();
};

// تشغيل عند فتح الصفحة
loadCustomers();
loadProducts();
