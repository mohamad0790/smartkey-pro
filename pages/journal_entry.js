// pages/journal_entry.js

import { supabase } from './supabase.js'; // تأكد من أن هذا المسار صحيح لملف supabase.js الخاص بك

const linesBody = document.getElementById('entry-lines-body');
const totalDebitElement = document.getElementById('total-debit');
const totalCreditElement = document.getElementById('total-credit');
const balanceError = document.getElementById('balance-error');
const saveButton = document.getElementById('save-entry');
const addButton = document.getElementById('add-line');
const saveSuccess = document.getElementById('save-success');

let chartOfAccounts = []; // سنخزن هنا دليل الحسابات

// 1. جلب دليل الحسابات من Supabase
async function fetchChartOfAccounts() {
    // جلب فقط الحسابات التي يمكن التسجيل عليها (is_posting = true)
    const { data, error } = await supabase
        .from('chart_of_accounts')
        .select('account_id, account_code, account_name_ar')
        .eq('is_posting', true) // نستخدم فقط الحسابات التفصيلية
        .order('account_code', { ascending: true });

    if (error) {
        console.error('Error fetching COA:', error.message);
        return;
    }
    chartOfAccounts = data;
    // بعد جلب الحسابات، نضيف السطر الأول للقيد
    addLine();
}

// 2. إنشاء سطر جديد في جدول القيود
function createLineRow() {
    const row = document.createElement('tr');
    row.innerHTML = `
        <td>
            <select class="account-select" required>
                <option value="">اختر الحساب...</option>
                ${chartOfAccounts.map(acc => 
                    `<option value="${acc.account_id}">${acc.account_code} - ${acc.account_name_ar}</option>`
                ).join('')}
            </select>
        </td>
        <td><input type="number" class="debit-input" min="0" value="0.00" oninput="updateTotals()"></td>
        <td><input type="number" class="credit-input" min="0" value="0.00" oninput="updateTotals()"></td>
        <td><button class="remove-line-btn">X</button></td>
    `;
    
    // إضافة مستمعي الأحداث داخل JavaScript لضمان الربط
    const debitInput = row.querySelector('.debit-input');
    const creditInput = row.querySelector('.credit-input');
    const removeButton = row.querySelector('.remove-line-btn');
    
    debitInput.addEventListener('input', updateTotals);
    creditInput.addEventListener('input', updateTotals);
    removeButton.addEventListener('click', () => {
        row.remove();
        updateTotals();
    });
    
    // إضافة قاعدة: إذا أدخل المستخدم قيمة في "مدين"، يجب أن يصبح "دائن" صفر، والعكس صحيح.
    debitInput.addEventListener('input', () => {
        if (debitInput.value > 0) creditInput.value = '0.00';
    });
    creditInput.addEventListener('input', () => {
        if (creditInput.value > 0) debitInput.value = '0.00';
    });

    return row;
}

function addLine() {
    linesBody.appendChild(createLineRow());
}

// 3. تحديث المجاميع والتحقق من التوازن (القلب المحاسبي)
window.updateTotals = function() {
    let totalDebit = 0;
    let totalCredit = 0;
    
    // جمع كل قيم المدين والدائن في الجدول
    linesBody.querySelectorAll('tr').forEach(row => {
        const debit = parseFloat(row.querySelector('.debit-input').value) || 0;
        const credit = parseFloat(row.querySelector('.credit-input').value) || 0;
        
        totalDebit += debit;
        totalCredit += credit;
    });

    // عرض المجاميع
    totalDebitElement.textContent = totalDebit.toFixed(2);
    totalCreditElement.textContent = totalCredit.toFixed(2);

    // التحقق من التوازن (المنطق المحاسبي)
    const difference = Math.abs(totalDebit - totalCredit);
    
    if (difference > 0.001) { // نستخدم مجال خطأ بسيط للأرقام العشرية
        balanceError.textContent = `القيد غير متوازن! الفرق: ${difference.toFixed(2)}`;
        saveButton.disabled = true; // لا يمكن الحفظ إلا إذا كان متوازنًا
    } else {
        balanceError.textContent = '';
        saveButton.disabled = false; // القيد متوازن، يمكن الحفظ
    }
}

// 4. دالة الحفظ الرئيسية (الترحيل إلى Supabase)
saveButton.addEventListener('click', async () => {
    // 1. جمع بيانات الرأس
    const entryDate = document.getElementById('entry-date').value;
    const referenceNumber = document.getElementById('reference-number').value;
    const description = document.getElementById('description').value;

    if (!entryDate || !description) {
        alert('الرجاء إدخال التاريخ والوصف.');
        return;
    }
    
    // 2. التحقق النهائي من التوازن
    if (saveButton.disabled) {
        alert('لا يمكن حفظ قيد غير متوازن.');
        return;
    }

    // 3. إدراج رأس القيد (Journal Entry Header)
    const { data: entryData, error: entryError } = await supabase
        .from('journal_entries')
        .insert([{ 
            entry_date: entryDate, 
            reference_number: referenceNumber, 
            description: description 
        }])
        .select('entry_id')
        .single(); // نتوقع إرجاع سطر واحد فقط (الـ ID الجديد)
        
    if (entryError) {
        console.error('Error inserting entry header:', entryError.message);
        alert('حدث خطأ في حفظ رأس القيد.');
        return;
    }

    const newEntryId = entryData.entry_id;
    let linesToInsert = [];

    // 4. جمع بيانات تفاصيل القيد (Journal Entry Lines)
    linesBody.querySelectorAll('tr').forEach(row => {
        const accountId = row.querySelector('.account-select').value;
        const debit = parseFloat(row.querySelector('.debit-input').value) || 0;
        const credit = parseFloat(row.querySelector('.credit-input').value) || 0;

        if (accountId && (debit > 0 || credit > 0)) {
            linesToInsert.push({
                entry_id: newEntryId,
                account_id: accountId,
                debit_amount: debit,
                credit_amount: credit
            });
        }
    });

    // 5. إدراج تفاصيل القيد
    const { error: linesError } = await supabase
        .from('journal_entry_lines')
        .insert(linesToInsert);
        
    if (linesError) {
        // إذا فشل إدراج الأسطر، يجب نظرياً حذف رأس القيد الذي تم إدخاله للتو (لضمان سلامة البيانات)
        console.error('Error inserting lines:', linesError.message);
        await supabase.from('journal_entries').delete().eq('entry_id', newEntryId);
        alert('حدث خطأ في حفظ تفاصيل القيد. تم إلغاء العملية.');
        return;
    }

    // 6. نجاح العملية
    saveSuccess.style.display = 'block';
    // تنظيف الواجهة لبدء قيد جديد
    setTimeout(() => {
        location.reload(); 
    }, 2000);
});

// ربط الزر add-line بالدالة addLine
addButton.addEventListener('click', addLine);

// البدء بجلب الحسابات عند تحميل الصفحة
fetchChartOfAccounts();
