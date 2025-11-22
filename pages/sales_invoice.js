// pages/sales_invoice.js

import { supabase } from './supabase.js'; // تأكد من المسار الصحيح

const clientSearchInput = document.getElementById('client-search');
const clientNameDisplay = document.getElementById('client-name-display');
const previousBalanceDisplay = document.getElementById('previous-balance-display').querySelector('.balance-box');
const clientIdInput = document.getElementById('client-id');
const invoiceItemsBody = document.getElementById('invoice-items-body');

let allProducts = []; // لتخزين قائمة المنتجات المتاحة
let selectedClient = null; // لتخزين بيانات العميل الحالي

// 1. جلب المنتجات عند تحميل الصفحة
async function fetchProducts() {
    const { data, error } = await supabase
        .from('products')
        .select('id, name, sell'); // جلب ID، الاسم، وسعر البيع

    if (error) {
        console.error('Error fetching products:', error.message);
        return;
    }
    allProducts = data;
    addItemRow(); // إضافة سطر صنف فارغ بعد جلب المنتجات
}

// 2. دالة البحث عن العميل وجلب رصيده السابق
window.searchClient = async function() {
    const searchTerm = clientSearchInput.value.trim();
    if (!searchTerm) return;

    // بحث عن العميل بالاسم أو رقم الجوال
    const { data, error } = await supabase
        .from('customers')
        .select('id, name')
        .or(`name.ilike.%${searchTerm}%,phone_number.eq.${searchTerm}`);

    if (error || !data || data.length === 0) {
        alert('لم يتم العثور على العميل.');
        resetClientInfo();
        return;
    }
    
    // افتراض اختيار أول عميل تم العثور عليه
    selectedClient = data[0]; 
    clientIdInput.value = selectedClient.id;
    clientNameDisplay.textContent = `اسم العميل: ${selectedClient.name}`;
    
    // جلب الرصيد السابق للعميل
    await fetchPreviousBalance(selectedClient.id);
}

// 3. جلب الرصيد السابق للعميل من جدول customer_transactions
async function fetchPreviousBalance(customerId) {
    // حساب الرصيد من جدول المعاملات
    // هذا يتطلب دالة (RPC) في Supabase لحساب الرصيد الفعلي (جمع المدين وطرح الدائن)
    
    // ****** ملاحظة هامة: هذا الكود يفترض وجود دالة في Supabase اسمها 'calculate_client_balance' ******
    const { data, error } = await supabase.rpc('calculate_client_balance', { client_id: customerId });
    
    if (error) {
        console.warn('Error fetching balance. Assuming 0.00:', error.message);
        previousBalanceDisplay.textContent = '0.00';
        return;
    }
    
    const balance = data || 0;
    previousBalanceDisplay.textContent = balance.toFixed(2);
    // تلوين الرصيد حسب ما إذا كان له رصيد سابق (دين عليه)
    previousBalanceDisplay.style.backgroundColor = balance > 0 ? '#ffcdd2' : '#c8e6c9';
}

function resetClientInfo() {
    selectedClient = null;
    clientIdInput.value = '';
    clientNameDisplay.textContent = 'اسم العميل: لم يتم الاختيار';
    previousBalanceDisplay.textContent = '0.00';
    previousBalanceDisplay.style.backgroundColor = '#ffeb3b';
}

// 4. دالة إضافة سطر صنف جديد
function addItemRow() {
    const row = document.createElement('tr');
    row.innerHTML = `
        <td>
            <select class="product-select" onchange="updatePrice(this)">
                <option value="">اختر صنف...</option>
                ${allProducts.map(p => 
                    `<option value="${p.id}" data-price="${p.sell}">${p.name}</option>`
                ).join('')}
            </select>
        </td>
        <td><input type="number" class="qty-input" value="1" min="1" oninput="calculateRowTotal(this)"></td>
        <td><input type="number" class="price-input" value="0.00" oninput="calculateRowTotal(this)"></td>
        <td class="row-total">0.00</td>
        <td><button onclick="removeRow(this)">X</button></td>
    `;
    invoiceItemsBody.appendChild(row);
    calculateTotal(); // تحديث الإجمالي بعد الإضافة
}

// 5. تحديث السعر عند اختيار الصنف
window.updatePrice = function(selectElement) {
    const row = selectElement.closest('tr');
    const price = selectElement.options[selectElement.selectedIndex].dataset.price || '0.00';
    row.querySelector('.price-input').value = parseFloat(price).toFixed(2);
    calculateRowTotal(selectElement);
}

// 6. حساب إجمالي السطر
window.calculateRowTotal = function(inputElement) {
    const row = inputElement.closest('tr');
    const qty = parseFloat(row.querySelector('.qty-input').value) || 0;
    const price = parseFloat(row.querySelector('.price-input').value) || 0;
    const total = qty * price;
    row.querySelector('.row-total').textContent = total.toFixed(2);
    calculateTotal(); // تحديث الإجمالي الكلي
}

// 7. حساب الإجمالي الكلي للفاتورة
window.calculateTotal = function() {
    let subTotal = 0;
    invoiceItemsBody.querySelectorAll('.row-total').forEach(el => {
        subTotal += parseFloat(el.textContent) || 0;
    });

    const discount = parseFloat(document.getElementById('discount').value) || 0;
    const finalTotal = subTotal - discount;
    const paymentAmount = parseFloat(document.getElementById('payment-amount').value) || 0;
    const remainingDue = finalTotal - paymentAmount;

    document.getElementById('sub-total').textContent = subTotal.toFixed(2);
    document.getElementById('final-total').textContent = finalTotal.toFixed(2);
    document.getElementById('remaining-due').textContent = remainingDue.toFixed(2);
}

// 8. دالة الحفظ (سنتوسع فيها لاحقًا لتوليد القيد المحاسبي)
window.saveInvoice = async function() {
    const totalDue = parseFloat(document.getElementById('final-total').textContent);
    const paymentAmount = parseFloat(document.getElementById('payment-amount').value);
    const paymentMethod = document.getElementById('payment-method').value;
    const remainingDue = parseFloat(document.getElementById('remaining-due').textContent);
    const clientId = clientIdInput.value;

    if (!clientId) {
        alert('الرجاء اختيار العميل أولاً.');
        return;
    }
    
    if (totalDue <= 0) {
        alert('إجمالي الفاتورة يجب أن يكون أكبر من صفر.');
        return;
    }
    
    // ****** النقطة الحاسمة: هنا سيتم استدعاء المنطق المعقد ******
    // 1. حفظ فاتورة المبيعات في جدول 'sales' و 'sale_items'
    // 2. إنشاء حركة مدينة جديدة على العميل في 'customer_transactions' بمبلغ الـ (remainingDue + paymentAmount)
    // 3. **توليد القيد اليومي الآلي** في 'journal_entries' و 'journal_entry_lines'
    
    alert(`تمت محاكاة حفظ الفاتورة بنجاح.\nالإجمالي: ${totalDue.toFixed(2)}\nالمبلغ المتبقي على العميل: ${remainingDue.toFixed(2)}`);
    
    // هنا يجب إضافة كود الإدراج في Supabase
    // ... (كود الحفظ والترحيل) ...
}

// ربط زر إضافة صنف
document.getElementById('add-item').addEventListener('click', addItemRow);

// دالة إزالة السطر
window.removeRow = function(btn) {
    btn.closest('tr').remove();
    calculateTotal();
}

// تهيئة: جلب المنتجات عند تحميل الصفحة
fetchProducts();
