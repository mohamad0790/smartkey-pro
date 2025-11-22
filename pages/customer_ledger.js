// pages/payment_voucher.js

import { supabase } from './supabase.js'; 

const expenseAccountSelect = document.getElementById('expense-account');
const paymentAmountInput = document.getElementById('payment-amount');
const paymentMethodSelect = document.getElementById('payment-method');
const voucherDescriptionInput = document.getElementById('voucher-description');

// ******* الأرقام المؤكدة *******
const ACCOUNT_ID_CASH = 1;         
const ACCOUNT_ID_BANK = 2;         
const ACCOUNT_ID_EXPENSE = 5;      
// *****************************************************************************************

// 1. جلب حسابات المصروفات عند تحميل الصفحة
async function fetchExpenseAccounts() {
    // ... كود جلب الحسابات
}

// 2. دالة حفظ سند الصرف والترحيل المحاسبي
window.savePaymentVoucher = async function() {
    // ... كود التحقق من البيانات
    // ... كود إنشاء القيد اليومي (المدين: المصروفات / الدائن: الصندوق أو البنك)
}

fetchExpenseAccounts();
