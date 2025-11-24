/ pages/login.js (الكود المحدث لـ RLS)

import { supabase } from './supabase.js';

const loginForm = document.getElementById('login-form');

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // نستخدم الـ ID / Pin للدخول كما يظهر في الجدول (حسب الحاجة لتطبيقك)
    // هنا سنعتمد على البريد الإلكتروني وكلمة المرور في الـ Authentication

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    try {
        // 1. تسجيل الدخول باستخدام Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: email,
            password: password,
        });

        if (authError) throw authError;

        // ملاحظة: بما أنك تستخدم ID نصي (admin, seller1)، يجب أن نتأكد أن الـ ID في جدول users
        // يتطابق مع الـ ID في الـ Authentication. 
        // سنفترض أنك وضعت البريد الإلكتروني في حقل الـ ID في الـ Authentication،
        // وسنستخدم الـ authData.user.email للحصول على الـ ID.

        const userId = authData.user.email; // استخدام الإيميل كمعرّف للمستخدم

        // 2. جلب دور المستخدم (Role) من جدول public.users
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('user_role')
            .eq('id', userId) 
            .single();

        if (userError || !userData) {
            alert('فشل في جلب صلاحية المستخدم. تأكد من تطابق بيانات المستخدم في جدول users ونظام Authentication.');
            await supabase.auth.signOut();
            return;
        }

        const userRole = userData.user_role;

        // 3. التوجيه بناءً على الصلاحية
        if (userRole === 'admin') {
            window.location.href = '../index.html'; // المدير يذهب للقائمة الرئيسية الكاملة
        } else if (userRole === 'seller') {
            window.location.href = 'seller_dashboard.html'; // البائع يذهب للوحة تحكم مقيدة
        } else {
            alert('صلاحية غير معروفة.');
            await supabase.auth.signOut();
        }

    } catch (error) {
        alert(`فشل تسجيل الدخول: ${error.message}`);
    }
});
