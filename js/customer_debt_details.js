import { supabase } from "../supabase.js";

const urlParams = new URLSearchParams(window.location.search);
const customerId = urlParams.get("id");

// تحميل بيانات العميل + ما عليه من ديون
async function loadCustomerInfo() {
    const box = document.getElementById("customerInfo");

    const { data, error } = await supabase
        .from("customer_debts")
        .select("*, customers(name)")
        .eq("customer_id", customerId)
        .single();

    if (error) {
        box.innerHTML = "خطأ في تحميل البيانات";
        return;
    }

    box.innerHTML = `
        <strong>العميل: ${data.customers.name}</strong><br>
        <strong>إجمالي الديون: ${data.amount} ريال</strong>
    `;
}

// عرض سجل الدفعات
async function loadPayments() {
    const list = document.getElementById("paymentsList");

    const { data, error } = await supabase
        .from("sales_payments")
        .select("*")
        .eq("customer_id", customerId)
        .order("created_at", { ascending: false });

    if (error) {
        list.innerHTML = "خطأ في تحميل البيانات";
        return;
    }

    if (!data.length) {
        list.innerHTML = "<p>لا يوجد دفعات مسجلة</p>";
        return;
    }

    list.innerHTML = "";
    data.forEach(p => {
        const div = document.createElement("div");
        div.className = "card";

        div.innerHTML = `
            <strong>الدفعة: ${p.amount} ريال</strong><br>
            <span>${p.created_at}</span>
        `;

        list.appendChild(div);
    });
}

// إضافة دفعة
window.addPayment = async function () {
    const amount = document.getElementById("amount").value;

    if (!amount || amount <= 0) {
        alert("أدخل مبلغ صحيح");
        return;
    }

    const { error } = await supabase
        .from("sales_payments")
        .insert({
            customer_id: customerId,
            amount: amount
        });

    if (error) {
        alert("خطأ في الإضافة");
        return;
    }

    alert("تمت الإضافة بنجاح 🎉");
    loadPayments();
};

// تشغيل
loadCustomerInfo();
loadPayments();
