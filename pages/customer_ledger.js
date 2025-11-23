import { supabase } from "../supabase.js";

// تحميل العملاء مع الرصيد
async function loadCustomers() {
    let table = document.getElementById("customers_table");
    table.innerHTML = "<tr><th>العميل</th><th>الجوال</th><th>الرصيد</th></tr>";

    const { data: customers, error } = await supabase
        .from("customers")
        .select("*")
        .order("customer_name");

    if (error) {
        console.error(error);
        return;
    }

    for (let c of customers) {
        // جلب آخر رصيد للعميل
        const { data: lastTrans } = await supabase
            .from("customer_transactions")
            .select("balance_after")
            .eq("customer_id", c.id)
            .order("created_at", { ascending: false })
            .limit(1);

        let balance = lastTrans?.length ? lastTrans[0].balance_after : 0;

        table.innerHTML += `
            <tr onclick="openLedger('${c.id}')">
                <td>${c.customer_name}</td>
                <td>${c.phone}</td>
                <td>${balance}</td>
            </tr>`;
    }
}

window.onload = loadCustomers;

// فتح كشف حساب عميل
function openLedger(customerId) {
    localStorage.setItem("selectedCustomer", customerId);
    window.location.href = "customer_ledger_details.html";
}

window.openLedger = openLedger;
