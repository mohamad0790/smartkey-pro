// تحميل العملاء
async function loadCustomers() {
    const { data, error } = await supabase.from("customers").select("*");
    const select = document.getElementById("customerSelect");

    if (data) {
        data.forEach(c => {
            select.innerHTML += `<option value="${c.id}">${c.name}</option>`;
        });
    }
}

// تحميل المنتجات
async function loadProducts() {
    const { data } = await supabase.from("products").select("*");
    const select = document.getElementById("productSelect");

    if (data) {
        data.forEach(p => {
            select.innerHTML += `
                <option value="${p.id}" data-price="${p.sell}">
                    ${p.name}
                </option>`;
        });
    }
}

let items = [];

// إضافة صنف إلى الفاتورة
function addItem() {
    const productSelect = document.getElementById("productSelect");
    const qtyInput = document.getElementById("qty");
    const discountInput = document.getElementById("discount");

    const productId = productSelect.value;
    const productName = productSelect.options[productSelect.selectedIndex].text;
    const price = Number(productSelect.options[productSelect.selectedIndex].dataset.price);
    const qty = Number(qtyInput.value);
    const discount = Number(discountInput.value) || 0;

    if (!productId || !qty) {
        alert("⚠️ الرجاء اختيار منتج وكمية");
        return;
    }

    const total = (price * qty) - discount;

    items.push({
        product_id: productId,
        name: productName,
        price: price,
        qty: qty,
        discount: discount,
        total: total
    });

    renderTable();
    updateTotal();
}

// عرض الأصناف في الجدول
function renderTable() {
    const table = document.getElementById("itemsTable");
    table.innerHTML = "";

    items.forEach((item, index) => {
        table.innerHTML += `
            <tr>
                <td>${item.name}</td>
                <td>${item.qty}</td>
                <td>${item.price}</td>
                <td>${item.total}</td>
                <td><button onclick="deleteItem(${index})">❌</button></td>
            </tr>`;
    });
}

// حذف صنف
function deleteItem(index) {
    items.splice(index, 1);
    renderTable();
    updateTotal();
}

// تحديث الإجمالي النهائي
function updateTotal() {
    let total = items.reduce((sum, item) => sum + item.total, 0);
    document.getElementById("totalFinal").innerText = total;
}

// حفظ الفاتورة
async function saveInvoice() {
    const customer = document.getElementById("customerSelect").value;

    if (!customer || items.length === 0) {
        alert("⚠️ الرجاء اختيار عميل وإضافة أصناف");
        return;
    }

    const { data, error } = await supabase
        .from("sales")
        .insert([{ customer: customer, items: items }]);

    if (error) {
        alert("❌ خطأ في حفظ الفاتورة");
        console.log(error);
    } else {
        alert("✅ تم حفظ الفاتورة بنجاح");
    }
}

// تشغيل
loadCustomers();
loadProducts();
