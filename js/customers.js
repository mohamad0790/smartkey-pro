import { supabase } from "../supabase.js";

const body = document.getElementById("customersBody");
const searchInput = document.getElementById("search");

async function getBalance(customer_id){
  const { data, error } = await supabase
    .from("customer_transactions")
    .select("amount")
    .eq("customer_id", customer_id);

  if(error){ console.error(error); return 0; }
  return (data || []).reduce((s,r)=> s + (Number(r.amount)||0), 0);
}

async function loadCustomers(){
  body.innerHTML = `<tr><td colspan="4">جاري التحميل...</td></tr>`;

  const { data: customers, error } = await supabase
    .from("customers")
    .select("*")
    .order("created_at", { ascending:false });

  if(error){
    console.error(error);
    body.innerHTML = `<tr><td colspan="4">خطأ في تحميل العملاء</td></tr>`;
    return;
  }

  render(customers || []);
}

async function render(customers){
  body.innerHTML = "";
  for(const c of customers){
    const bal = await getBalance(c.id);

    body.innerHTML += `
      <tr>
        <td>${c.name || ""}</td>
        <td>${c.phone || ""}</td>
        <td>${bal.toFixed(2)}</td>
        <td class="actions">
          <button class="ledger" onclick="openLedger('${c.id}')">دفتر</button>
          <button class="edit" onclick="editCustomer('${c.id}')">تعديل</button>
          <button class="del" onclick="deleteCustomer('${c.id}')">حذف</button>
        </td>
      </tr>
    `;
  }

  if(customers.length===0){
    body.innerHTML = `<tr><td colspan="4">لا يوجد عملاء</td></tr>`;
  }
}

searchInput?.addEventListener("input", async ()=>{
  const q = searchInput.value.trim().toLowerCase();
  const { data } = await supabase.from("customers").select("*");
  const filtered = (data||[]).filter(c =>
    (c.name||"").toLowerCase().includes(q) ||
    (c.phone||"").toLowerCase().includes(q)
  );
  render(filtered);
});

window.goAdd = ()=> location.href = "customer_add.html";
window.editCustomer = (id)=>{
  localStorage.setItem("editCustomerId", id);
  location.href = "customer_edit.html";
};
window.openLedger = (id)=>{
  localStorage.setItem("selectedCustomer", id);
  location.href = "customer_ledger_details.html";
};

window.deleteCustomer = async (id)=>{
  if(!confirm("متأكد تحذف العميل؟")) return;

  // احذف حركاته أولاً (عشان ما يرفض FK)
  await supabase.from("customer_transactions").delete().eq("customer_id", id);

  const { error } = await supabase.from("customers").delete().eq("id", id);
  if(error){ alert("ما قدرنا نحذف"); console.error(error); return; }
  loadCustomers();
};

loadCustomers();
