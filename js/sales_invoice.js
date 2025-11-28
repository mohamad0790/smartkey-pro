// sales_invoice.js

// استخراج رقم الفاتورة من الرابط
const urlParams = new URLSearchParams(window.location.search);
const invoiceId = urlParams.get("id");

// مكان عرض البيانات
document.getElementById("invoiceId").innerText = invoiceId || "غير متوفر";

// تحميل الفاتورة من قاعدة البيانات
async function loadInvoice() {
    if (!invoiceId) return alert("لا يوجد رقم فاتورة!");

    // جلب بيانات الفاتورة الأساسية
    const { data: invoice, error } = await supabase
        .from("sales")
        .select("*")
        .eq("id", invoiceId)
        .single();

    if (error || !invoice) {
        alert("خطأ في تحميل الفاتورة");
        console.log(error);
        return;
    }

    document.getElementById("customerName").innerText = invoice.customer_name;
    document.getElementById("invoiceDate").innerText = invoice.date;
    document.getElementById("finalTotal").innerText = invoice.total;

    // جلب تفاصيل الفاتورة (الأصناف)
    const { data: items } = await supabase
        .from("sales_items")
        .select("*")
        .eq("invoice_id", invoiceId);

    const tableBody = document.getElementById("itemsTable");
    tableBody.innerHTML = "";

    items.forEach(item => {
        const row = `
            <tr>
                <td>${item.product_name}</td>
                <td>${item.qty}</td>
                <td>${item.price}</td>
                <td>${item.total}</td>
            </tr>
        `;
        tableBody.innerHTML += row;
    });
}

loadInvoice();
