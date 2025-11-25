import { supabase } from "../supabase.js";

const id = localStorage.getItem("editCustomerId");

async function load(){
  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .eq("id", id)
    .single();

  if(error){ console.error(error); alert("ما لقينا العميل"); return; }

  document.getElementById("name").value = data.name || "";
  document.getElementById("phone").value = data.phone || "";
}

window.updateCustomer = async ()=>{
  const name = document.getElementById("name").value.trim();
  const phone = document.getElementById("phone").value.trim();

  const { error } = await supabase
    .from("customers")
    .update({ name, phone })
    .eq("id", id);

  if(error){ console.error(error); alert("فشل التحديث"); return; }

  localStorage.removeItem("editCustomerId");
  location.href = "customers.html";
};

load();
