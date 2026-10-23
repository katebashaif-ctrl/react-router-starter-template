-- ==============================================================================
-- Teen Liwa E-Commerce - Orders Database Schema (Cloudflare D1 / SQLite)
-- متجر تين ليوا وخيرات الدار - هيكلية قاعدة بيانات الطلبات
-- ==============================================================================

-- 1. جدول الطلبات الرئيسي (Orders Table)
CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,                       -- المعرف الفريد للطلب (مثال: ord-m19x8f2)
    order_number TEXT NOT NULL UNIQUE,         -- رقم الطلب المرجعي للعميل (مثال: AED-5821)
    customer_name TEXT NOT NULL,               -- اسم العميل الكريم
    customer_phone TEXT NOT NULL,              -- رقم الهاتف للتواصل (+971...)
    customer_emirate TEXT NOT NULL,            -- الإمارة (أبوظبي، دبي، الشارقة، عجمان، أم القيوين، رأس الخيمة، الفجيرة، العين)
    customer_address TEXT NOT NULL,            -- العنوان التفصيلي (المنطقة، الشارع، الفيلا/البناية)
    notes TEXT,                                -- ملاحظات إضافية للتوصيل
    gift_note TEXT,                            -- رسالة بطاقة الإهداء الفاخرة
    subtotal REAL NOT NULL DEFAULT 0,          -- المجموع الفرعي قبل التوصيل (درهم إماراتي)
    delivery_fee REAL NOT NULL DEFAULT 0,      -- رسوم التوصيل المبرد
    discount REAL NOT NULL DEFAULT 0,          -- قيمة الخصم (إن وجد)
    total REAL NOT NULL DEFAULT 0,             -- المبلغ الإجمالي النهائي (AED)
    payment_method TEXT NOT NULL DEFAULT 'cod',-- طريقة الدفع: 'cod' (نقداً), 'card_on_delivery' (بطاقة), 'whatsapp' (واتساب)
    payment_status TEXT NOT NULL DEFAULT 'pending', -- حالة الدفع: 'pending', 'paid', 'refunded'
    status TEXT NOT NULL DEFAULT 'pending',    -- حالة الطلب: 'pending', 'processing', 'shipped', 'delivered', 'cancelled'
    items_json TEXT NOT NULL,                  -- تفاصيل المنتجات بصيغة JSON لسهولة القراءة السريعة
    source TEXT NOT NULL DEFAULT 'web_store',  -- مصدر الطلب: 'web_store', 'whatsapp', 'meta_ad'
    created_at TEXT NOT NULL DEFAULT (datetime('now')), -- تاريخ ووقت استلام الطلب
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))  -- تاريخ آخر تحديث للحالة
);

-- 2. جدول أصناف الطلب المنفصل (Order Items Relational Table)
CREATE TABLE IF NOT EXISTS order_items (
    id TEXT PRIMARY KEY,                       -- معرف الصنف
    order_id TEXT NOT NULL,                    -- معرف الطلب المرتبط
    product_id TEXT NOT NULL,                  -- معرف المنتج (مثال: prod-1)
    name TEXT NOT NULL,                        -- اسم المنتج (تين، رطب، فقع...)
    quantity INTEGER NOT NULL DEFAULT 1,       -- الكمية المطلوبة
    price REAL NOT NULL,                       -- سعر الوحدة (درهم)
    unit TEXT NOT NULL,                        -- الوحدة (كجم، سحارة...)
    packaging_option TEXT,                     -- نوع التغليف: standard، luxury_wood_box، chilled_carton
    total_price REAL NOT NULL,                 -- إجمالي الصنف (الكمية × السعر)
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- 3. سجل العملاء المتكررين وقاعدة بيانات المشترين (Customers Registry)
CREATE TABLE IF NOT EXISTS customers (
    phone TEXT PRIMARY KEY,                    -- رقم هاتف العميل (المفتاح الأساسي)
    name TEXT NOT NULL,                        -- اسم العميل
    emirate TEXT NOT NULL,                     -- الإمارة
    last_address TEXT,                         -- آخر عنوان توصيل مسجل
    total_orders INTEGER NOT NULL DEFAULT 1,   -- إجمالي عدد الطلبات
    total_spent REAL NOT NULL DEFAULT 0,       -- إجمالي المبالغ المدفوعة (AED)
    last_order_at TEXT NOT NULL DEFAULT (datetime('now')),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 4. الفهارس لتحسين سرعة الاستعلامات والتقارير (Indexes)
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_phone ON orders(customer_phone);
CREATE INDEX IF NOT EXISTS idx_orders_emirate ON orders(customer_emirate);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);
