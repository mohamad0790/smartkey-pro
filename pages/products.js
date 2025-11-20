import { supabase } from "./supabase.js";

// =========================
//  تحميل جميع الأصناف
// =========================
async function loadProducts() {
  const tableBody = document.querySelector("#productsTableBody");
  tableBody.innerHTML = `<tr><td colspan="5">جارٍ التحميل...</td></tr>`;

  const { data, error } = await supabase.from("products").select("*");

  if (error) {
    tableBody.innerHTML = `<tr><td colspan="5">خطأ في تحميل البيانات</td></tr>`;
    console.error(error);
    return;
  }

  tableBody.innerHTML = "";

  data.forEach((item) => {
    tableBody.innerHTML += `
      <tr>
        <td>${item.id}</td>
        <td>${item.name}</td>
        <td>${item.price}</td>
        <td>${item.quantity}</td>
        <td>
          <button onclick="editProduct(${item.id})">✏️ تعديل</button>
          <button onclick="deleteProduct(${item.id})">🗑 حذف</button>
        </td>
      </tr>
    `;
  });
}

// =========================
//    إضافة صنف جديد
// =========================
document.querySelector("#addProductForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.querySelector("#name").value;
  const price = document.querySelector("#price").value;
  const quantity = document.querySelector("#quantity").value;

  const { error } = await supabase.from("products").insert({
    name,
    price,
    quantity
  });

  if (error) {
    alert("خطأ في إضافة الصنف");
    console.error(error);
    return;
  }

  alert("تم إضافة الصنف بنجاح!");
  loadProducts();
});

// =========================
//      تعديل صنف
// =========================
window.editProduct = async function (id) {
  const newName = prompt("اسم جديد:");
  const newPrice = prompt("السعر الجديد:");
  const newQuantity = prompt("الكمية الجديدة:");

  const { error } = await supabase
    .from("products")
    .update({ name: newName, price: newPrice, quantity: newQuantity })
    .eq("id", id);

  if (error) {
    alert("خطأ في تعديل الصنف");
    return;
  }

  alert("تم تعديل الصنف!");
  loadProducts();
};

// =========================
//        حذف صنف
// =========================
window.deleteProduct = async function (id) {
  if (!confirm("هل تريد حذف الصنف؟")) return;

  const { error } = await supabase.from("products").delete().eq("id", id);

  if (error) {
    alert("خطأ في الحذف");
    return;
  }

  alert("تم حذف الصنف!");
  loadProducts();
};

// تحميل البيانات عند فتح الصفحة
loadProducts();
