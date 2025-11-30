// حماية الصفحات
export function protect(roleAllowed = []) {
    let user = localStorage.getItem("logged_user");

    if (!user) {
        location.href = "login.html";
        return;
    }

    user = JSON.parse(user);

    // حماية حسب الدور
    if (roleAllowed.length > 0 && !roleAllowed.includes(user.role)) {
        alert("غير مسموح لك بدخول هذه الصفحة");
        location.href = "../index.html";
    }
}

// تسجيل خروج
export function logout() {
    localStorage.removeItem("logged_user");
    location.href = "login.html";
}
