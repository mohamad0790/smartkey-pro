// sales_details.js

import { supabase } from "../supabase.js";

// تحميل العملاء
async function loadCustomers() {
    const { data, error } = await supabase.from("customers").select("*");
    const select = document.getElementById("customerSelect");

    if (error) {
        console.log("خطأ تحميل العملاء:", error);
        return;
    }

    select.innerHTML = "<option value=''>اختر العميل</option>";

    data.forEach(c => {
        select.innerHTML += `<option value="${c.id}">${c.name}</option>`;
    });
}

// تحميل المنتجات
async function loadProducts() {
    const { data, error } = await supabase.from("products").select("*");
    const select = document.getElementById("productSelect");

    if (error) {
        console.log("خطأ تحميل المنتجات:", error);
        return;
    }

    select.innerHTML = "<option value=''>اختر المنتج</option>";

    data.forEach(p => {
        select.innerHTML += `<option value="${p.id}" data-price="${p.price}">${p.name}</option>`;
    });
}

let items = [];

// إضافة صنف للفاتورة
window.addItem = function () {
    const productSelect = document.getElementById("productSelect");
    const qty = Number(document.getElementById("qty").value);
    const discount = Number(document.getElementById("discount").value) || 0;

    if (!productSelect.value || qty <= 0) {
        alert("الرجاء اختيار منتج وكمية صحيحة");
        return;
    }

    const name = productSelect.options[productSelect.selectedIndex].text;
    const price = Number(productSelect.options[productSelect.selectedIndex].dataset.price);

    const total = (price * qty) - discount;

    items.push({ name, qty, price, discount, total });

    renderItems();
};

// عرض الأصناف في الجدول
function renderItems() {
    const table = document.getElementById("itemsTable");
    const totalFinal = document.getElementById("totalFinal");

    table.innerHTML = "";
    let finalTotal = 0;

    items.forEach((item, i) => {
        table.innerHTML += `
            <tr>
                <td>${item.name}</td>
                <td>${item.qty}</td>
                <td>${item.price}</td>
                <td>${item.total}</td>
                <td><button onclick="deleteItem(${i})">❌</button></td>
            </tr>
        `;
        finalTotal += item.total;
    });

    totalFinal.innerText = finalTotal;
}

// حذف صنف
window.deleteItem = function (index) {
    items.splice(index, 1);
    renderItems();
};

// حفظ الفاتورة
window.saveInvoice = async function () {
    const customerId = document.getElementById("customerSelect").value;

    if (!customerId || items.length === 0) {
        alert("الرجاء اختيار العميل وإضافة أصناف");
        return;
    }

    const { data, error } = await supabase.from("sales").insert([
        {
            customer_id: customerId,
            items: items,
            total: items.reduce((sum, x) => sum + x.total, 0),
            date: new Date(),
        }
    ]);

    if (error) {
        alert("فشل حفظ الفاتورة");
        console.log(error);
    } else {
        alert("تم حفظ الفاتورة بنجاح");
        items = [];
        renderItems();
    }
};

// تشغيل التحميل عند فتح الصفحة
loadCustomers();
loadProducts();
