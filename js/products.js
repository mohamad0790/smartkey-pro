<!DOCTYPE html>
<html lang="ar">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>إدارة الأصناف</title>

    <style>
        body {
            font-family: Arial;
            background: #f5f5f5;
            text-align: center;
            direction: rtl;
            padding: 20px;
        }

        h1 {
            font-size: 28px;
            margin-bottom: 25px;
        }

        input {
            width: 90%;
            padding: 12px;
            margin: 8px 0;
            border: 1px solid #ccc;
            border-radius: 8px;
            font-size: 17px;
        }

        button {
            width: 90%;
            padding: 14px;
            background: #28a745;
            color: white;
            border: none;
            font-size: 20px;
            border-radius: 10px;
            cursor: pointer;
            margin-top: 10px;
        }

        table {
            width: 100%;
            margin-top: 25px;
            background: white;
            border-collapse: collapse;
            font-size: 17px;
        }

        th, td {
            border: 1px solid #ccc;
            padding: 10px;
        }

        th {
            background: #ddd;
        }
    </style>
</head>
<body>

    <h1>إدارة الأصناف 🛒</h1>

    <form id="productForm">
        <input id="product_code" placeholder="كود الصنف" />
        <input id="name" placeholder="اسم الصنف" />
        <input id="buy" placeholder="سعر الشراء" />
        <input id="sell" placeholder="سعر البيع" />
        <input id="quantity" placeholder="الكمية" value="1" />

        <button type="submit">إضافة الصنف ➕</button>
    </form>

    <table>
        <thead>
            <tr>
                <th>الكود</th>
                <th>الاسم</th>
                <th>الشراء</th>
                <th>البيع</th>
                <th>الكمية</th>
                <th>التاريخ</th>
            </tr>
        </thead>
        <tbody id="productsTableBody"></tbody>
    </table>

    <!-- روابط السكربتات -->
    <script type="module" src="https://mohamad0790.github.io/smartkey-pro/supabase.js"></script>
    <script type="module" src="https://mohamad0790.github.io/smartkey-pro/js/products.js"></script>

</body>
</html>
