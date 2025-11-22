// pages/sales_invoice.js

import { supabase } from './supabase.js'; 

const clientSearchInput = document.getElementById('client-search');
const clientNameDisplay = document.getElementById('client-name-display');
const previousBalanceDisplay = document.getElementById('previous-balance-display').querySelector('.balance-box');
const clientIdInput = document.getElementById('client-id');
const invoiceItemsBody = document.getElementById('invoice-items-body');

let allProducts = []; 
let selectedClient = null; 

// ******* الأرقام المؤكدة بناءً على جدول Supabase لديك *******
// (1: الصندوق, 2: البنك, 3: الذمم المدينة, 4: الإيرادات)
const ACCOUNT_ID_CASH = 1;         // ID حساب الصندوق
const ACCOUNT_ID_BANK = 2;         // ID حساب البنك
const ACCOUNT_ID_AR = 3;           // ID حساب الذمم المدينة (العملاء)
const ACCOUNT_ID_REVENUE = 4;      // ID حساب إيرادات المبيعات
// *****************************************************************************************


// 1. جلب المنتجات عند تحميل الصفحة
async function fetchProducts() {
    // نفترض أن جدول المنتجات (products) يحتوي على حقول id, name, sell
    const { data, error } = await supabase
        .from('products')
        .select('id, name, sell'); 

    if (error) {
        console.error('Error fetching products:', error.message);
        // يمكنك هنا إضافة سطر لإنشاء منتج تجريبي إذا كان الجدول فارغاً
        return;
    }
    allProducts = data;
    addItemRow(); 
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
    
    // جلب الرصيد السابق باستخدام دالة RPC التي أنشأناها في Supabase
    await fetchPreviousBalance(selectedClient.id);
}

// 3. جلب الرصيد السابق للعميل من جدول customer_transactions
async function fetchPreviousBalance(customerId) {
    // نستخدم دالة RPC التي تتوقع client_id_param
    const { data: balanceData, error } = await supabase.rpc('calculate_client_balance', { client_id_param: customerId });
    
    if (error) {
        console.warn('Error fetching balance. Assuming 0.00:', error.message);
        previousBalanceDisplay.textContent = '0.00';
        return;
    }
    
    const balance = balanceData || 0;
    previousBalanceDisplay.textContent = balance.toFixed(2);
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
    calculateTotal(); 
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
    calculateTotal(); 
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

// 8. دالة الحفظ الرئيسية والترحيل المحاس
