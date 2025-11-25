import { supabase } from "../supabase.js";

window.saveCustomer = async ()=>{
  const name = document.getElementById("name").value.trim();
  const phone = document.getElementById("phone").value.trim();

  if(!name){ alert("اكتب اسم العميل"); return; }

  const { error } = await supabase.from("customers").insert([{ name, phone }]);

  if(error){ console.error(error); alert("فشل الحفظ"); return; }

  location.href = "customers.html";
};
