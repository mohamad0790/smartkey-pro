import { supabase } from "../supabase.js";

// تحميل الديون
async function loadDebts() {
    const list = document.getElementById("debtsList");

    const { data, error } = await supabase
        .from("customer_debts")
        .select("id, customer_id, amount, created_at, customers(name)")
        .order("created_at", { ascending: false });

    if (error) {
        list.innerHTML = "خطأ في تحميل البيانات";
        return;
    }

    if (!data || data.length === 0) {
        list.innerHTML = "<p>لا توجد ديون مسجلة</p>";
        return;
    }

    list.innerHTML = "";

    data.forEach(debt => {
        const div = document.createElement("div");
        div.className = "customer-card";

        div.innerHTML = `
            <div class="title">${debt.customers.name}</div>
            <div class="amount">مديونية: ${debt.amount} ريال</div>
            <button onclick="openPayments('${debt.customer_id}')">عرض وتسجيل دفعات</button>
        `;

        list.appendChild(div);
    });
}

window.openPayments = function (customerId) {
    window.location.href = `customer_debt_details.html?id=${customerId}`;
};

loadDebts();
