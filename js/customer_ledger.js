import { supabase } from "../supabase.js";

const table = document.getElementById("customers_table");

async function getBalance(customer_id){
  const { data } = await supabase
    .from("customer_transactions")
    .select("amount")
    .eq("customer_id", customer_id);

  return (data||[]).reduce((s,r)=> s + (Number(r.amount)||0), 0);
}

async function loadCustomers(){
  table.innerHTML = `<tr><td colspan="3">جاري التحميل...</td></tr>`;

  const { data: customers, error } = await supabase
    .from("customers")
    .select("*")
    .order("name", { ascending:true });

  if(error){ console.error(error); return; }

  table.innerHTML = "";
  for(const c of customers){
    const bal = await getBalance(c.id);
    table.innerHTML += `
      <tr onclick="openLedger('${c.id}')">
        <td>${c.name}</td>
        <td>${c.phone||""}</td>
        <td>${bal.toFixed(2)}</td>
      </tr>
    `;
  }
}

window.openLedger = (customerId)=>{
  localStorage.setItem("selectedCustomer", customerId);
  location.href = "customer_ledger_details.html";
};

loadCustomers();
