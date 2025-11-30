// ===============================
//      نظام الحماية الكامل
// ===============================

export function protect(allowedRoles = []) {
    let user = localStorage.getItem("logged_user");

    // لو ما فيه جلسة → رجّعه صفحة الدخول
    if (!user) {
        window.location.href = "../pages/login.html";
        return;
    }

    user = JSON.parse(user);

    // لو المستخدم ليس لديه صلاحية → رجّعه حسب نوعه
    if (!allowedRoles.includes(user.role)) {

        if (user.role === "seller") {
            window.location.href = "../pages/sales.html";
        } else {
            window.location.href = "../index.html";
        }

    }
}

// تسجيل خروج
export function logout() {
    localStorage.removeItem("logged_user");
    window.location.href = "../pages/login.html";
}
