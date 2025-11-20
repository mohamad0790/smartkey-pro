import { supabase } from './supabase.js';

// تحميل المنتجات
export async function loadProducts() {
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('id', { ascending: false });

    if (error) {
        console.error('Error loading products:', error);
        return [];
    }
    return data;
}

// إضافة منتج جديد
export async function addProduct(product) {
    const { data, error } = await supabase
        .from('products')
        .insert([product]);

    if (error) {
        console.error('Error adding product:', error);
        return null;
    }
    return data;
}

// حذف منتج
export async function deleteProduct(id) {
    const { data, error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting product:', error);
        return null;
    }
    return data;
}
