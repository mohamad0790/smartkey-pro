// sales_details.js

// تحميل العملاء
async function loadCustomers() {
    const { data, error } = await supabase.from("customers").select("*");
    const select = document.getElementById("customerSelect");

    if (data) {
        data.forEach(c => {
            select.innerHTML += `<option value="${c.name}">${c.name}</option>`;
        });
    }
}

// تحميل المنتجات
async function loadProducts() {
    const { data } = await supabase.from("products").select("*");
    const select = document.getElementById("productSelect");

    data.forEach(p => {
        select.innerHTML += `<option value="${p.name}" data-price="${p.price}">${p.name}</option>`;
    });
}

let items = [];

function addItem() {
    const product = document.getElementById("productSelect");
    const qty = parseFloat(document.getElementById("qty").value);
    const discount = parseFloat(document.getElementById("discount").value) || 0;

    const name = product.value;
    const price = parseFloat(product.selectedOptions[0].dataset.price);

    if (!qty || qty <= 0) {
        alert("الرجاء إدخال كمية صحيحة");
        return;
    }

    const total = (price * qty) - discount;

    items.push({
        name,
        qty,
        price,
        total
    });

    renderItems();
}

function renderItems() {
    const table = document.getElementById("itemsTable");
    table.innerHTML = "";

    let finalTotal = 0;

    items.forEach((i, index) => {
        finalTotal += i.total;
        table.innerHTML += `
            <tr>
                <td>${i.name}</td>
                <td>${i.qty}</td>
                <td>${i.price}</td>
                <td>${i.total}</td>
                <td><button onclick="deleteItem(${index})">❌</button></td>
            </tr>
        `;
    });

    document.getElementById("totalFinal").innerText = finalTotal;
}

function deleteItem(index) {
    items.splice(index, 1);
    renderItems();
}

// حفظ الفاتورة
async function saveInvoice() {
    if (items.length === 0) {
        alert("لا يوجد أصناف");
        return;
    }

    const customer = document.getElementById("customerSelect").value;
    const finalTotal = document.getElementById("totalFinal").innerText;
    const date = new Date().toISOString().split("T")[0];

    // حفظ الفاتورة الأساسية
    const { data: invoice, error } = await supabase
        .from("sales")
        .insert([{ customer, total: finalTotal, date }])
        .select()
        .single();

    if (error) {
        alert("خطأ في حفظ الفاتورة");
        console.log("Error saving invoice:", error);
        return;
    }

    const invoiceId = invoice.id;

    // حفظ الأصناف
    for (let item of items) {
        await supabase.from("sales_items").insert([
            {
                invoice_id: invoiceId,
                product_name: item.name,
                qty: item.qty,
                price: item.price,
                total: item.total
            }
        ]);
    }

    alert("تم حفظ الفاتورة بنجاح");
    location.href = `sales_invoice.html?id=${invoiceId}`;
}

loadCustomers();
loadProducts();
