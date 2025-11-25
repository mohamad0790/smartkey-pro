import { supabase } from "../supabase.js";

// 🔹 إنشاء فاتورة جديدة
async function createSaleInvoice(customerId, items, paidAmount, sellerId) {
    try {
        // 1️⃣ حساب إجمالي الفاتورة
        let totalAmount = 0;
        items.forEach(item => {
            totalAmount += item.quantity * item.price;
        });

        const remainingAmount = totalAmount - paidAmount;

        // 2️⃣ إضافة الفاتورة إلى جدول sales_invoices
        const { data: invoice, error: invoiceError } = await supabase
            .from("sales_invoices")
            .insert([
                {
                    customer_id: customerId,
                    total_amount: totalAmount,
                    paid_amount: paidAmount,
                    remaining_amount: remainingAmount,
                    seller_id: sellerId
                }
            ])
            .select()
            .single();

        if (invoiceError) {
            console.error(invoiceError);
            alert("❌ فشل إنشاء الفاتورة");
            return;
        }

        const invoiceId = invoice.id;

        // 3️⃣ إضافة أصناف الفاتورة إلى جدول sale_items
        for (let i of items) {
            const { error: itemError } = await supabase
                .from("sale_items")
                .insert([
                    {
                        sale_id: invoiceId,
                        product_id: i.product_id,
                        quantity: i.quantity,
                        price: i.price
                    }
                ]);

            if (itemError) console.error(itemError);
        }

        // 4️⃣ تحديث المخزون (خصم الكمية)
        for (let i of items) {
            await supabase.rpc("decrease_stock", {
                product_id_input: i.product_id,
                qty: i.quantity
            });
        }

        // 5️⃣ تحديث رصيد العميل customer_transactions
        const { error: transError } = await supabase
            .from("customer_transactions")
            .insert([
                {
                    customer_id: customerId,
                    amount: totalAmount,
                    paid: paidAmount,
                    balance_after: remainingAmount
                }
            ]);

        if (transError) console.error(transError);

        alert("✅ تم إنشاء الفاتورة بنجاح");
        return invoiceId;

    } catch (err) {
        console.error(err);
        alert("❌ حدث خطأ غير متوقع");
    }
}

// 🔹 مثال استخدام
// createSaleInvoice(customerId, itemsArray, paidAmount, sellerId);

// 🔹 جعل الدالة متاحة للصفحة
window.createSaleInvoice = createSaleInvoice;
