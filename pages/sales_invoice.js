// pages/sales_invoice.js

import { supabase } from './supabase.js'; 

const clientSearchInput = document.getElementById('client-search');
const clientNameDisplay = document.getElementById('client-name-display');
const previousBalanceDisplay = document.getElementById('previous-balance-display').querySelector('.balance-box');
const clientIdInput = document.getElementById('client-id');
const invoiceItemsBody = document.getElementById('invoice-items-body');

let allProducts = []; 
let selectedClient = null; 

// ******* يجب تعديل هذه الأرقام لتتطابق مع الـ IDs الفعلية في جدول chart_of_accounts *******
// قم بتعبئة جدول دليل الحسابات أولاً واستبدل هذه القيم بأرقام الـ ID التي تحصل عليها.
const ACCOUNT_ID_CASH = 1;         // ID حساب الصندوق (مثال: 1101001)
const ACCOUNT_ID_BANK = 2;         // ID حساب البنك (مثال: 1102001)
const ACCOUNT_ID_AR = 3;           // ID حساب الذمم المدينة (العملاء) (مثال: 1201)
const ACCOUNT_ID_REVENUE = 4;      // ID حساب إيرادات المبيعات (مثال: 4101001)
// *****************************************************************************************


// 1. جلب المنتجات عند تحميل الصفحة
async function fetchProducts() {
    const { data, error } = await supabase
        .from('products')
        .select('id, name, sell'); 

    if (error) {
        console.error('Error fetching products:', error.message);
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
    
    selectedClient = data[0]; 
    clientIdInput.value = selectedClient.id;
    clientNameDisplay.textContent = `اسم العميل: ${selectedClient.name}`;
    
    // جلب الرصيد السابق باستخدام دالة RPC التي أنشأناها في Supabase
    await fetchPreviousBalance(selectedClient.id);
}

// 3. جلب الرصيد السابق للعميل من جدول customer_transactions
async function fetchPreviousBalance(customerId) {
    // نستخدم الدالة التي تم إنشاؤها في Supabase
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

// 8. دالة الحفظ الرئيسية والترحيل المحاسبي
window.saveInvoice = async function() {
    const entryDate = new Date().toISOString().slice(0, 10);
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
    
    if (paymentAmount > totalDue) {
        alert('المبلغ المدفوع يتجاوز الإجمالي المستحق.');
        return;
    }

    try {
        // -----------------------------------------------------------
        // 1. حفظ رأس الفاتورة في جدول 'sales'
        // -----------------------------------------------------------
        const { data: saleData, error: saleError } = await supabase
            .from('sales')
            .insert([{ 
                customer_id: clientId, 
                sale_date: entryDate, 
                total_amount: totalDue,
                discount: parseFloat(document.getElementById('discount').value) || 0,
                payment_method: paymentMethod
            }])
            .select('id')
            .single();

        if (saleError) throw new Error('فشل في حفظ رأس الفاتورة.');
        
        const newSaleId = saleData.id;
        let saleItemsToInsert = [];

        // 1.1 حفظ تفاصيل الأصناف في جدول 'sale_items'
        invoiceItemsBody.querySelectorAll('tr').forEach(row => {
            const productSelect = row.querySelector('.product-select');
            const productId = productSelect ? productSelect.value : null;
            const qty = parseFloat(row.querySelector('.qty-input').value) || 0;
            const price = parseFloat(row.querySelector('.price-input').value) || 0;

            if (productId && qty > 0) {
                saleItemsToInsert.push({
                    sale_id: newSaleId,
                    item_id: productId,
                    quantity: qty,
                    unit_price: price,
                    total_price: qty * price
                });
            }
        });
        
        const { error: itemsError } = await supabase.from('sale_items').insert(saleItemsToInsert);
        if (itemsError) throw new Error('فشل في حفظ تفاصيل الأصناف.');
        
        // -----------------------------------------------------------
        // 2. توليد القيد اليومي الآلي (Journal Entry)
        // -----------------------------------------------------------
        
        // 2.1 حفظ رأس القيد (Journal Entry Header)
        const { data: entryData, error: entryError } = await supabase
            .from('journal_entries')
            .insert([{ 
                entry_date: entryDate, 
                reference_number: `INV-${newSaleId}`, 
                description: `قيد فاتورة مبيعات رقم ${newSaleId} للعميل ${clientNameDisplay.textContent.split(':')[1].trim()}` 
            }])
            .select('entry_id')
            .single();

        if (entryError) throw new Error('فشل في حفظ رأس القيد.');
        const newEntryId = entryData.entry_id;
        
        let journalLines = [];
        
        // 2.2 السطر الدائن الثابت: إيرادات المبيعات (بإجمالي المبلغ المستحق)
        journalLines.push({
            entry_id: newEntryId,
            account_id: ACCOUNT_ID_REVENUE,
            debit_amount: 0,
            credit_amount: totalDue 
        });
        
        // 2.3 السطور المدينة: تقسم بين المدفوعات والذمم المدينة
        
        // أ. جزء المدفوعات (إذا كان هناك مبلغ مدفوع)
        if (paymentAmount > 0) {
            let debitAccount;
            if (paymentMethod === 'cash') debitAccount = ACCOUNT_ID_CASH;
            else if (paymentMethod === 'bank') debitAccount = ACCOUNT_ID_BANK;
            else debitAccount = ACCOUNT_ID_CASH; // افتراض النقد لأي طريقة دفع غير محددة (مثل الدفعة المقدمة على آجل)

            if (debitAccount) {
                 journalLines.push({
                    entry_id: newEntryId,
                    account_id: debitAccount,
                    debit_amount: paymentAmount,
                    credit_amount: 0
                });
            }
        }
        
        // ب. جزء الذمم المدينة (إذا كان هناك مبلغ متبقٍ آجل)
        if (remainingDue > 0) {
            journalLines.push({
                entry_id: newEntryId,
                account_id: ACCOUNT_ID_AR, // حساب إجمالي العملاء
                debit_amount: remainingDue,
                credit_amount: 0
            });
            
            // -----------------------------------------------------------
            // 3. إنشاء حركة مدينة في سجل العميل (Customer Transaction)
            // -----------------------------------------------------------
            const { error: transError } = await supabase
                .from('customer_transactions')
                .insert([{ 
                    customer_id: clientId, 
                    transaction_date: entryDate,
                    reference_doc_id: newSaleId, 
                    debit_amount: remainingDue, // المبلغ المتبقي على العميل يعتبر مدين
                    credit_amount: 0,
                    description: `فاتورة مبيعات رقم ${newSaleId} آجل`
                }]);
            if (transError) throw new Error('فشل في تسجيل الحركة المدينة للعميل.');
        }

        // 2.4 إدراج جميع سطور القيد المحاسبي
        const { error: linesError } = await supabase.from('journal_entry_lines').insert(journalLines);
        if (linesError) throw new Error('فشل في حفظ تفاصيل القيد المحاسبي.');

        // -----------------------------------------------------------
        // 4. إظهار النجاح وتنظيف الواجهة
        // -----------------------------------------------------------
        alert('✅ تم حفظ الفاتورة وتوليد القيد المحاسبي بنجاح!');
        location.reload(); 

    } catch (e) {
        console.error('فشل في عملية الحفظ الشاملة:', e.message);
        alert(`❌ فشل الحفظ: ${e.message}. الرجاء التحقق من: 1) إعداد دالة calculate_client_balance. 2) أرقام الحسابات في الكود!`);
    }
}


// (بقية الكود تبقى كما هي)
document.getElementById('add-item').addEventListener('click', addItemRow);
window.removeRow = function(btn) {
    btn.closest('tr').remove();
    calculateTotal();
}
fetchProducts();
