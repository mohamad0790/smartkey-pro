import { supabase } from "../supabase.js";

async function loadLedger() {
    const customerId = localStorage.getItem("selectedCustomer");
    if (!customerId) {
        alert("❗ لم يتم تحديد العميل");
        return;
    }

    // ▢ 1- تحميل بيانات العميل
    const { data: customer } = await supabase
        .from("customers")
        .select("*")
        .eq("id", customerId)
        .single();

    if (!customer) {
        document.getElementById("customer_info").innerHTML = "❗ العميل غير موجود!";
        return;
    }

    document.getElementById("customer_info").innerHTML = `
        <b>👤 العميل:</b> ${customer.name}<br>
        <b>📱 الجوال:</b> ${customer.phone}<br>
        <b>💰 الرصيد الحالي:</b> ${customer.balance}
    `;

    // ▢ 2- تحميل العمليات المالية للعميل
    const { data: trans } = await supabase
        .from("customer_transactions")
        .select("*")
        .eq("customer_id", customerId)
        .order("created_at", { ascending: true });

    let table = document.getElementById("ledger_table");

    if (!trans || trans.length === 0) {
        table.innerHTML += `
            <tr><td colspan="5">لا توجد عمليات لهذا العميل</td></tr>
        `;
        return;
    }

    for (let t of trans) {
        table.innerHTML += `
            <tr>
                <td>${new Date(t.created_at).toLocaleString("ar-EG")}</td>
                <td>${t.type}</td>
                <td>${t.amount}</td>
                <td>${t.balance_after}</td>
                <td>${t.note ?? ""}</td>
            </tr>
        `;
    }
}

window.onload = loadLedger;
