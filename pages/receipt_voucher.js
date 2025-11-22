// pages/receipt_voucher.js

import { supabase } from './supabase.js'; 

const clientSearchInput = document.getElementById('client-search');
const clientIdInput = document.getElementById('client-id');
const clientNameDisplay = document.getElementById('client-name-display');
const currentBalanceDisplay = document.getElementById('current-balance-display');
const receiptAmountInput = document.getElementById('receipt-amount');
const paymentMethodSelect = document.getElementById('payment-method');
const receiptDescriptionInput = document.getElementById('receipt-description');

// ******* الأرقام المؤكدة بناءً على جدول Supabase لديك *******
const ACCOUNT_ID_CASH = 1;         // ID حساب الصندوق
const ACCOUNT_ID_BANK = 2;         // ID حساب البنك
const ACCOUNT_ID_AR = 3;           // ID حساب الذمم المدينة (العملاء)
// *****************************************************************************************

let selectedClient = null;

// دالة جلب الرصيد السابق (مماثلة لما في فاتورة المبيعات)
async function fetchPreviousBalance(customerId) {
    const { data: balanceData, error } = await supabase.rpc('calculate_client_balance', { client_id_param: customerId });
    
    const balance = balanceData || 0;
    currentBalanceDisplay.textContent = `الرصيد الحالي: ${balance.toFixed(2)}`;
    // إذا كان الرصيد موجبًا (مدين)، نعرضه بلون تحذيري
    currentBalanceDisplay.style.color = balance > 0 ? '#c0392b' : '#27ae60'; 
    return balance;
}

// دالة البحث عن العميل
window.searchClient = async function() {
    const searchTerm = clientSearchInput.value.trim();
    if (!searchTerm) return;

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
    clientNameDisplay.textContent = `العميل المحدد: ${selectedClient.name}`;
    
    await fetchPreviousBalance(selectedClient.id);
}

function resetClientInfo() {
    selectedClient = null;
    clientIdInput.value = '';
    clientNameDisplay.textContent = 'العميل المحدد: لم يتم الاختيار';
    currentBalanceDisplay.textContent = 'الرصيد الحالي: 0.00';
}

// دالة حفظ سند القبض والترحيل المحاسبي
window.saveReceiptVoucher = async function() {
    const entryDate = new Date().toISOString().slice(0, 10);
    const clientId = clientIdInput.value;
    const paymentAmount = parseFloat(receiptAmountInput.value) || 0;
    const paymentMethod = paymentMethodSelect.value;
    const description = receiptDescriptionInput.value.trim() || 'سداد جزء من الذمم المدينة';

    if (!clientId) {
        alert('الرجاء اختيار العميل أولاً.');
        return;
    }
    
    if (paymentAmount <= 0) {
        alert('المبلغ المدفوع يجب أن يكون أكبر من صفر.');
        return;
    }

    try {
        // -----------------------------------------------------------
        // 1. توليد القيد اليومي الآلي (Journal Entry)
        // -----------------------------------------------------------
        
        // 1.1 تحديد الحساب المدين (الذي زاد)
        const debitAccount = (paymentMethod === 'cash') ? ACCOUNT_ID_CASH : ACCOUNT_ID_BANK;
        
        // 1.2 حفظ رأس القيد
        const { data: entryData, error: entryError } = await supabase
            .from('journal_entries')
            .insert([{ 
                entry_date: entryDate, 
                reference_number: `RV-${Math.floor(Date.now() / 1000)}`, // رقم مرجعي عشوائي مؤقت
                description: `سند قبض من العميل ${selectedClient.name} - ${description}` 
            }])
            .select('entry_id')
            .single();

        if (entryError) throw new Error('فشل في حفظ رأس القيد.');
        const newEntryId = entryData.entry_id;
        
        let journalLines = [];
        
        // 1.3 السطر المدين: زيادة حساب الصندوق أو البنك
        journalLines.push({
            entry_id: newEntryId,
            account_id: debitAccount,
            debit_amount: paymentAmount,
            credit_amount: 0 
        });
        
        // 1.4 السطر الدائن: تخفيض حساب الذمم المدينة
        journalLines.push({
            entry_id: newEntryId,
            account_id: ACCOUNT_ID_AR, 
            debit_amount: 0,
            credit_amount: paymentAmount 
        });

        // 1.5 إدراج جميع سطور القيد المحاسبي
        const { error: linesError } = await supabase.from('journal_entry_lines').insert(journalLines);
        if (linesError) throw new Error('فشل في حفظ تفاصيل القيد المحاسبي.');

        // -----------------------------------------------------------
        // 2. إنشاء حركة دائنة في سجل العميل (Customer Transaction)
        // -----------------------------------------------------------
        
        // العميل قام بالدفع، لذا حساب الذمم المدينة (المبلغ المطلوب منه) يقل، وهي حركة دائنة
        const { error: transError } = await supabase
            .from('customer_transactions')
            .insert([{ 
                customer_id: clientId, 
                transaction_date: entryDate,
                reference_doc_id: newEntryId, // يمكن استخدام رقم القيد كمرجع
                debit_amount: 0, 
                credit_amount: paymentAmount, // المبلغ المدفوع من العميل يعتبر دائن
                description: `سند قبض رقم ${newEntryId}`
            }]);
        if (transError) throw new Error('فشل في تسجيل الحركة الدائنة للعميل.');

        // -----------------------------------------------------------
        // 3. إظهار النجاح وتنظيف الواجهة
        // -----------------------------------------------------------
        alert('✅ تم حفظ سند القبض وتوليد القيد المحاسبي بنجاح!');
        location.reload(); 

    } catch (e) {
        console.error('فشل في عملية الحفظ الشاملة لسند القبض:', e.message);
        alert(`❌ فشل الحفظ: ${e.message}.`);
    }
}


// تهيئة: جلب المنتجات عند تحميل الصفحة
// لا يوجد جلب منتجات هنا، لكن يمكن وضع دالة تهيئة إذا احتجنا
// fetchProducts();
