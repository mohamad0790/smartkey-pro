import { supabase } from "../supabase.js";

async function loadCustomers() {
    const body = document.getElementById("customers_body");
    body.innerHTML = "<tr><td colspan='3'>⏳ جاري التحميل...</td></tr>";

    const { data: customers, error } = await supabase
        .from("customers")
        .select("*")
        .order("name", { ascending: true });

    if (error) {
        console.error(error);
        body.innerHTML = "<tr><td colspan='3'>⚠ خطأ في التحميل</td></tr>";
        return;
    }

    body.innerHTML = "";

    for (let c of customers) {
        // نشوف آخر رصيد للعميل
        const { data: trans } = await supabase
            .from("customer_transactions")
            .select("balance_after")
            .eq("customer_id", c.id)
            .order("created_at", { ascending: false })
            .limit(1);

        let balance = trans?.length ? trans[0].balance_after : 0;

        body.innerHTML += `
            <tr onclick="openLedger('${c.id}')">
                <td>${c.name ?? c.customer_name}</td>
                <td>${c.phone ?? "—"}</td>
                <td>${balance}</td>
            </tr>
        `;
    }
}

window.openLedger = function(id) {
    localStorage.setItem("selectedCustomer", id);
    window.location.href = "customer_ledger.html";
}

window.onload = loadCustomers;
