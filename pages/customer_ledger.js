// pages/customer_ledger.js

import { supabase } from './supabase.js'; 

const clientSearchInput = document.getElementById('client-search');
const clientIdInput = document.getElementById('client-id');
const clientNameDisplay = document.getElementById('client-name-display');
const currentBalanceDisplay = document.getElementById('current-balance-display');
const ledgerBody = document.getElementById('ledger-body');

// 1. دالة البحث عن العميل
window.searchClient = async function() {
    const searchTerm = clientSearchInput.value.trim();
    if (!searchTerm) return;

    // بحث عن العميل
    const { data, error } = await supabase
        .from('customers')
        .select('id, name')
        .or(`name.ilike.%${searchTerm}%,phone_number.eq.${searchTerm}`);

    if (error || !data || data.length === 0) {
        alert('لم يتم العثور على العميل.');
        resetClientInfo();
        return;
    }
    
    const selectedClient = data[0]; 
    clientIdInput.value = selectedClient.id;
    clientNameDisplay.textContent = `العميل المحدد: ${selectedClient.name}`;
    
    // بمجرد العثور على العميل، نعرض دفتر الأستاذ له
    await fetchCustomerLedger(selectedClient.id);
}

// 2. دالة جلب سجل الحركات وحساب الرصيد التراكمي
async function fetchCustomerLedger(customerId) {
    ledgerBody.innerHTML = '<tr><td colspan="5" style="text-align:center;">جاري تحميل البيانات...</td></tr>';
    currentBalanceDisplay.textContent = 'الرصيد الحالي: 0.00';

    // جلب جميع حركات العميل من جدول customer_transactions
    const { data: transactions, error } = await supabase
        .from('customer_transactions')
        .select(`
            transaction_date, 
            description, 
            debit_amount, 
            credit_amount,
            reference_doc_id
        `)
        .eq('customer_id', customerId)
        .order('transaction_date', { ascending: true }); // نرتب بالتاريخ لحساب الرصيد التراكمي

    if (error) {
        console.error('Error fetching ledger:', error.message);
        ledgerBody.innerHTML = '<tr><td colspan="5" style="color:red; text-align:center;">فشل في تحميل سجل الحركات.</td></tr>';
        return;
    }
    
    if (transactions.length === 0) {
         ledgerBody.innerHTML = '<tr><td colspan="5" style="text-align:center;">لا توجد حركات مسجلة لهذا العميل.</td></tr>';
         return;
    }

    // 3. حساب الرصيد التراكمي وعرض الجدول
    let cumulativeBalance = 0;
    let htmlContent = '';

    transactions.forEach(t => {
        // المدين يزيد الرصيد (العميل مدين لك)
        // الدائن يقلل الرصيد (العميل قام بالدفع لك)
        cumulativeBalance += t.debit_amount - t.credit_amount;
        
        const balanceClass = cumulativeBalance > 0 ? 'debit' : (cumulativeBalance < 0 ? 'credit' : '');

        htmlContent += `
            <tr>
                <td>${t.transaction_date}</td>
                <td>${t.description} (Ref: ${t.reference_doc_id || '-'})</td>
                <td class="debit">${t.debit_amount.toFixed(2)}</td>
                <td class="credit">${t.credit_amount.toFixed(2)}</td>
                <td class="${balanceClass}">${cumulativeBalance.toFixed(2)}</td>
            </tr>
        `;
    });

    ledgerBody.innerHTML = htmlContent;
    currentBalanceDisplay.textContent = `الرصيد الحالي: ${cumulativeBalance.toFixed(2)}`;
    currentBalanceDisplay.style.color = cumulativeBalance > 0 ? '#c0392b' : '#27ae60';
}


function resetClientInfo() {
    clientIdInput.value = '';
    clientNameDisplay.textContent = 'العميل المحدد: لم يتم الاختيار';
    currentBalanceDisplay.textContent = 'الرصيد الحالي: 0.00';
    ledgerBody.innerHTML = '';
}
