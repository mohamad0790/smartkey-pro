import { supabase } from "../supabase.js";

const customerId = localStorage.getItem("selectedCustomer");
const transBody = document.getElementById("transBody");
const balanceEl = document.getElementById("balance");
const titleEl = document.getElementById("title");

async function loadCustomer(){
  const { data } = await supabase
    .from("customers")
    .select("*")
    .eq("id", customerId)
    .single();

  titleEl.textContent = `📄 كشف حساب: ${data?.name || ""}`;
}

async function loadTrans(){
  transBody.innerHTML = `<tr><td colspan="4">جاري التحميل...</td></tr>`;

  const { data, error } = await supabase
    .from("customer_transactions")
    .select("*")
    .eq("customer_id", customerId)
    .order("created_at", { ascending:false });

  if(error){ console.error(error); return; }

  let bal = 0;
  (data||[]).forEach(r => bal += Number(r.amount)||0);
  balanceEl.textContent = bal.toFixed(2);

  transBody.innerHTML = "";
  for(const t of data||[]){
    const isNeg = (Number(t.amount)||0) < 0;
    transBody.innerHTML += `
      <tr>
        <td>${new Date(t.created_at).toLocaleString()}</td>
        <td>${t.type}</td>
        <td class="${isNeg?'neg':'pos'}">${Number(t.amount).toFixed(2)}</td>
        <td>${t.note||""}</td>
      </tr>
    `;
  }

  if((data||[]).length===0){
    transBody.innerHTML = `<tr><td colspan="4">لا توجد حركات</td></tr>`;
  }
}

window.addTrans = async ()=>{
  const type = document.getElementById("type").value;
  const amountInput = Number(document.getElementById("amount").value || 0);
  const note = document.getElementById("note").value.trim();

  if(!amountInput || amountInput <= 0){
    alert("اكتب مبلغ صحيح"); return;
  }

  // الدين = موجب ، السداد = سالب
  const signedAmount = (type === "credit") ? -amountInput : amountInput;

  const { error } = await supabase.from("customer_transactions").insert([{
    customer_id: customerId,
    type,
    amount: signedAmount,
    note
  }]);

  if(error){ console.error(error); alert("فشل إضافة الحركة"); return; }

  document.getElementById("amount").value = "";
  document.getElementById("note").value = "";
  loadTrans();
};

loadCustomer();
loadTrans();
