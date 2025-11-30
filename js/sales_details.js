// حفظ الفاتورة
window.saveInvoice = async function () {
    let customerId = document.getElementById("customerSelect").value;

    if (!customerId) return alert("اختر العميل");
    if (invoiceItems.length === 0) return alert("لا توجد أصناف");

    // 1) حفظ رأس الفاتورة في sales_invoices
    const { data, error } = await supabase
        .from("sales_invoices")
        .insert([{
            customer_id: customerId,
            total_amount: invoiceItems.reduce((sum, item) => sum + item.total, 0),
            paid_amount: 0,
            remaining_amount: invoiceItems.reduce((sum, item) => sum + item.total, 0),
            created_at: new Date()
        }])
        .select();

    if (error || !data) {
        console.log(error);
        return alert("خطأ في حفظ الفاتورة (الرأس)");
    }

    let invoiceId = data[0].id;

    // 2) حفظ الأصناف داخل جدول sale_items
    for (let item of invoiceItems) {
        await supabase.from("sale_items").insert([{
            sale_id: invoiceId,
            product_id: item.product_id,
            quantity: item.qty,
            price: item.price
        }]);
    }

    alert("✔ تم حفظ الفاتورة بنجاح");
    window.location.href = `sales_invoice.html?id=${invoiceId}`;
};
