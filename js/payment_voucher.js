// pages/payment_voucher.js

import { supabase } from './supabase.js'; 

const expenseAccountSelect = document.getElementById('expense-account');
const paymentAmountInput = document.getElementById('payment-amount');
const paymentMethodSelect = document.getElementById('payment-method');
const voucherDescriptionInput = document.getElementById('voucher-description');

// ******* الأرقام المؤكدة *******
const ACCOUNT_ID_CASH = 1;         // ID حساب الصندوق 
const ACCOUNT_ID_BANK = 2;         // ID حساب البنك 
// ID حساب المصروفات الجديدة (مصروفات عامة وإدارية)
const ACCOUNT_ID_EXPENSE = 5;      
// *****************************************************************************************


// 1. جلب حسابات المصروفات عند تحميل الصفحة (لإظهارها في قائمة الاختيار)
async function fetchExpenseAccounts() {
    // حسابات المصروفات هي Account Type = 5
    const { data: accounts, error } = await supabase
        .from('chart_of_accounts')
        .select('account_id, account_name_ar')
        .eq('account_type', 5);

    if (error || !accounts || accounts.length === 0) {
        console.error('Error fetching expense accounts:', error.message);
        expenseAccountSelect.innerHTML = '<option value="">(فشل في جلب الحسابات أو الجدول فارغ)</option>';
        return;
    }
    
    // ملء قائمة المصروفات
    expenseAccountSelect.innerHTML = '';
    accounts.forEach(acc => {
        const option = document.createElement('option');
        option.value = acc.account_id;
        option.textContent = acc.account_name_ar;
        // يتم اختيار المصروفات العامة افتراضياً
        if (acc.account_id === ACCOUNT_ID_EXPENSE) {
            option.selected = true;
        }
        expenseAccountSelect.appendChild(option);
    });
}

// 2. دالة حفظ سند الصرف والترحيل المحاسبي
window.savePaymentVoucher = async function() {
    const entryDate = new Date().toISOString().slice(0, 10);
    const expenseAccountId = expenseAccountSelect.value;
    const paymentAmount = parseFloat(paymentAmountInput.value) || 0;
    const paymentMethod = paymentMethodSelect.value;
    const description = voucherDescriptionInput.value.trim() || 'سند صرف مصروفات عامة';

    if (!expenseAccountId) {
        alert('الرجاء اختيار حساب المصروفات (المدين).');
        return;
    }
    
    if (paymentAmount <= 0) {
        alert('مبلغ الصرف يجب أن يكون أكبر من صفر.');
        return;
    }

    try {
        // -----------------------------------------------------------
        // 1. توليد القيد اليومي الآلي (Journal Entry)
        // -----------------------------------------------------------
        
        // 1.1 تحديد الحساب الدائن (الذي نقص)
        const creditAccount = (paymentMethod === 'cash') ? ACCOUNT_ID_CASH : ACCOUNT_ID_BANK;
        
        // 1.2 حفظ رأس القيد
        const { data: entryData, error: entryError } = await supabase
            .from('journal_entries')
            .insert([{ 
                entry_date: entryDate, 
                reference_number: `PV-${Math.floor(Date.now() / 1000)}`, 
                description: `سند صرف ${description}` 
            }])
            .select('entry_id')
            .single();

        if (entryError) throw new Error('فشل في حفظ رأس القيد: ' + entryError.message);
        const newEntryId = entryData.entry_id;
        
        let journalLines = [];
        
        // 1.3 السطر المدين: زيادة حساب المصروفات (المصروفات مدينة بطبيعتها)
        journalLines.push({
            entry_id: newEntryId,
            account_id: parseInt(expenseAccountId), 
            debit_amount: paymentAmount,
            credit_amount: 0 
        });
        
        // 1.4 السطر الدائن: تخفيض حساب الصندوق أو البنك (الأصول دائنه عند النقصان)
        journalLines.push({
            entry_id: newEntryId,
            account_id: creditAccount, 
            debit_amount: 0,
            credit_amount: paymentAmount 
        });

        // 1.5 إدراج جميع سطور القيد المحاسبي
        const { error: linesError } = await supabase.from('journal_entry_lines').insert(journalLines);
        if (linesError) throw new Error('فشل في حفظ تفاصيل القيد المحاسبي: ' + linesError.message);

        // -----------------------------------------------------------
        // 2. إظهار النجاح وتنظيف الواجهة
        // -----------------------------------------------------------
        alert('✅ تم حفظ سند الصرف وتوليد القيد المحاسبي بنجاح!');
        location.reload(); 

    } catch (e) {
        console.error('فشل في عملية الحفظ الشاملة لسند الصرف:', e.message);
        alert(`❌ فشل الحفظ: ${e.message}.`);
    }
}

// تهيئة: جلب حسابات المصروفات عند تحميل الصفحة
fetchExpenseAccounts();
