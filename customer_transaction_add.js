import { supabase } from "../supabase.js";

async function saveTransaction() {
    const customerId = localStorage.getItem("selectedCustomer");
    if (!customerId) return alert("خطأ: لا يوجد عميل محدد");

    let type = document.getElementById("type").value;
    let amount = Number(document.getElementById("amount").value);
    let note = document.getElementById("note").value;

    if (!amount || amount <= 0) {
        alert("الرجاء إدخال مبلغ صحيح");
        return;
    }

    // نحصل على آخر رصيد
    const { data: last } = await supabase
        .from("customer_transactions")
        .select("balance_after")
        .eq("customer_id", customerId)
        .order("created_at", { ascending: false })
        .limit(1);

    let currentBalance = last?.length ? last[0].balance_after : 0;

    // حساب الرصيد الجديد
    let newBalance = type === "دين"
        ? currentBalance + amount
        : currentBalance - amount;

    // إضافة العملية
    const { error } = await supabase
        .from("customer_transactions")
        .insert([{
            customer_id: customerId,
            type,
            amount,
            balance_after: newBalance,
            note
        }]);

    if (error) {
        console.error(error);
        alert("حدث خطأ!");
        return;
    }

    // تحديث رصيد العميل في جدول العملاء
    await supabase
        .from("customers")
        .update({ balance: newBalance })
        .eq("id", customerId);

    alert("✔ تمت إضافة العملية بنجاح");
    history.back();
}

window.saveTransaction = saveTransaction;
