// حفظ الفاتورة
window.saveInvoice = async function () {
    let customerId = document.getElementById("customerSelect").value;

    if (!customerId) return alert("اختر العميل");
    if (invoiceItems.length === 0) return alert("لا توجد أصناف");

    // إنشاء الفاتورة في جدول sales_invoices
    const { data, error } = await supabase
        .from("sales_invoices")
        .insert([{
            customer_id: customerId,
            total_amount: final,
            paid_amount: 0,
            remaining_amount: final,
            seller_id: null,
            created_at: new Date().toISOString()
        }])
        .select();

    if (error) {
        console.error(error);
        return alert("❌ خطأ في إنشاء الفاتورة: تحقق من أعمدة الجدول");
    }

    let invoiceId = data[0].id;

    // حفظ الأصناف داخل جدول sales
    for (let item of invoiceItems) {
        await supabase.from("sales").insert([{
            invoice_id: invoiceId,
            product_id: item.product_id,
            qty: item.qty,
            price: item.price,
            discount: item.discount,
            total: item.total
        }]);
    }

    alert("✅ تم حفظ الفاتورة بنجاح");
    window.location.href = `sales_invoice.html?id=${invoiceId}`;
};
