import { supabase } from "../supabase.js";

/* =========================
   Helpers
========================= */
function getCustomerName(c) {
  return c.customer_name ?? c.name ?? "بدون اسم";
}

function formatType(t) {
  if (t === "invoice") return "فاتورة (دين)";
  if (t === "payment") return "سند قبض";
  if (t === "adjustment") return "تعديل";
  return t;
}

/* =========================
   Load customers into select
========================= */
async function loadCustomers() {
  const select = document.getElementById("customer_select");
  select.innerHTML = `<option value="">-- اختر العميل --</option>`;

  const { data: customers, error } = await supabase
    .from("customers")
    .select("id, name, customer_name, phone")
    .order("name", { ascending: true });

  if (error) {
    console.error("loadCustomers error:", error);
    alert("خطأ في تحميل العملاء");
    return;
  }

  customers.forEach((c) => {
    const opt = document.createElement("option");
    opt.value = c.id;
    opt.textContent = `${getCustomerName(c)}${c.phone ? " - " + c.phone : ""}`;
    select.appendChild(opt);
  });
}

/* =========================
   Get customer balance
   (from last transaction)
========================= */
async function loadBalance(customerId) {
  const balanceArea = document.getElementById("balance_area");

  const { data, error } = await supabase
    .from("customer_transactions")
    .select("balance_after")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) {
    console.error("loadBalance error:", error);
    balanceArea.textContent = "الرصيد: 0 ريال";
    return 0;
  }

  const balance = data?.length ? Number(data[0].balance_after || 0) : 0;

  balanceArea.textContent = `الرصيد: ${balance} ريال`;
  return balance;
}

/* =========================
   Load transactions table
========================= */
async function loadTransactions(customerId) {
  const tbody = document.querySelector("#transactions_table tbody");
  tbody.innerHTML = "";

  const { data, error } = await supabase
    .from("customer_transactions")
    .select("id, type, amount, note, created_at")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("loadTransactions error:", error);
    alert("خطأ في تحميل كشف الحساب");
    return;
  }

  if (!data.length) {
    tbody.innerHTML = `
      <tr><td colspan="4">لا يوجد عمليات لهذا العميل</td></tr>
    `;
    return;
  }

  data.forEach((t) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${new Date(t.created_at).toLocaleString("ar-SA")}</td>
      <td>${formatType(t.type)}</td>
      <td>${Number(t.amount || 0)}</td>
      <td>${t.note || ""}</td>
    `;
    tbody.appendChild(tr);
  });
}

/* =========================
   When customer changes
========================= */
async function onCustomerChange() {
  const select = document.getElementById("customer_select");
  const customerId = select.value;
  if (!customerId) return;

  await loadBalance(customerId);
  await loadTransactions(customerId);
}

/* =========================
   Add new transaction
========================= */
async function addTransaction() {
  const customerId = document.getElementById("customer_select").value;
  const type = document.getElementById("txn_type").value;
  const amountVal = document.getElementById("amount").value;
  const note = document.getElementById("note").value.trim();

  if (!customerId) {
    alert("اختر عميل أولاً");
    return;
  }
  if (!amountVal || Number(amountVal) <= 0) {
    alert("اكتب مبلغ صحيح");
    return;
  }

  const amount = Number(amountVal);

  // الرصيد الحالي
  const currentBalance = await loadBalance(customerId);

  // حساب الرصيد الجديد
  // invoice = دين على العميل (يزيد الرصيد)
  // payment = سداد (ينقص الرصيد)
  // adjustment = تعديل مباشر (نضيف/نخصم حسب الإشارة)
  let newBalance = currentBalance;
  if (type === "invoice") newBalance = currentBalance + amount;
  if (type === "payment") newBalance = currentBalance - amount;
  if (type === "adjustment") newBalance = currentBalance + amount;

  const { error } = await supabase
    .from("customer_transactions")
    .insert([
      {
        customer_id: customerId,
        type,
        amount,
        note,
        balance_after: newBalance,
      },
    ]);

  if (error) {
    console.error("addTransaction error:", error);
    alert("حصل خطأ أثناء الحفظ");
    return;
  }

  document.getElementById("amount").value = "";
  document.getElementById("note").value = "";

  await loadBalance(customerId);
  await loadTransactions(customerId);
}

// نخليها متاحة للزر في HTML
window.addTransaction = addTransaction;

/* =========================
   Init
========================= */
window.addEventListener("load", async () => {
  await loadCustomers();

  const select = document.getElementById("customer_select");
  select.addEventListener("change", onCustomerChange);
});
