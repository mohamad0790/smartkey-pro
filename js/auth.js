// auth.js – حماية النظام كامل

export function protect(allowedRoles = []) {
    const user = JSON.parse(localStorage.getItem("user"));

    // لو ما في تسجيل دخول → رجّعه للّوج إن
    if (!user) {
        window.location.href = "login.html";
        return;
    }

    // لو الدور غير مسموح → رجّعه للداشبورد الخاص به
    if (!allowedRoles.includes(user.role)) {
        if (user.role === "seller") {
            window.location.href = "seller_dashboard.html";
        } else {
            window.location.href = "index.html";
        }
    }
}
