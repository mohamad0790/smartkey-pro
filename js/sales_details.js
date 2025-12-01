window.saveInvoice = async function () {
    let customerId = document.getElementById("customerSelect").value;

    if (!customerId) return alert("اختر العميل");
    if (invoiceItems.length === 0) return alert("لا توجد أصناف");

    // حساب الإجمالي النهائي
    let final = invoiceItems.reduce((sum, item) => sum + item.total, 0);

    // بيانات الفاتورة المطلوبة حسب جدول Supabase
    const invoiceData = {
        customer_id: customerId,
        total_amount: final,
        paid_amount: 0,
        remaining_amount: final,
        seller_id: "admin",   // تقدر تغيرها لاحقًا من نظام البائعين
        created_at: new Date().toISOString()
    };

    // إنشاء الفاتورة
    const { data, error } = await supabase
        .from("sales_invoices")
        .insert([invoiceData])
        .select();

    if (error) {
        console.log(error);
        alert("❌ فشل حفظ الفاتورة. تحقق من الأعمدة في Supabase");
        return;
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
            total: item.total,
            created_at: new Date().toISOString()
        }]);
    }

    alert("✅ تم حفظ الفاتورة بنجاح");
    window.location.href = `sales_invoice.html?id=${invoiceId}`;
};
