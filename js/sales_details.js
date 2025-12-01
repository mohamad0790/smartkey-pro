window.saveInvoice = async function () {
    let customerId = document.getElementById("customerSelect").value;

    if (!customerId) return alert("اختر العميل");

    if (invoiceItems.length === 0) return alert("لا توجد أصناف");

    // احسب الإجمالي
    let total = invoiceItems.reduce((sum, x) => sum + x.total, 0);

    // بيانات الفاتورة
    const invoiceData = {
        customer_id: customerId,
        total_amount: total,
        paid_amount: total,          // حالياً الدفع = الإجمالي
        remaining_amount: 0,         // لا يوجد باقي
        seller_name: "نظام",         // لاحقاً نغيره للبائع
        created_at: new Date()
    };

    // حفظ الفاتورة
    const { data, error } = await supabase
        .from("sales_invoices")
        .insert([invoiceData])
        .select();

    if (error) {
        console.log(error);
        alert("❌ خطأ في حفظ الفاتورة");
        return;
    }

    const invoiceId = data[0].id;

    // حفظ الأصناف
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

    alert("تم حفظ الفاتورة بنجاح");
    window.location.href = `sales_invoice.html?id=${invoiceId}`;
};
