// =========================================================================
// 🔍 1. THE NEW INITIALIZATION ENGINE (Put this right at the top)
// =========================================================================
function syncDriverUIState() {
    const activeDriver = localStorage.getItem("activeDriverSession");
    
    const guestMenu = document.getElementById("guestMenu");
    const userMenu = document.getElementById("userMenu");
    const dropdownUsername = document.getElementById("dropdownUsername");
    const avatarText = document.querySelector(".avatar-text");

    if (activeDriver) {
        if (guestMenu) guestMenu.style.setProperty("display", "none", "important");
        if (userMenu) userMenu.style.setProperty("display", "block", "important");
        if (dropdownUsername) dropdownUsername.textContent = activeDriver;
        
        if (avatarText) {
            // Splits "Avinash Vyas" into "A" and "V" automatically
            const initials = activeDriver.trim().split(" ").map(n => n[0]).join("").toUpperCase();
            avatarText.textContent = initials.substring(0, 2);
        }
    } else {
        if (guestMenu) guestMenu.style.setProperty("display", "block", "important");
        if (userMenu) userMenu.style.setProperty("display", "none", "important");
        if (avatarText) avatarText.textContent = "AV";
    }
}

// Forces Chrome to fire the synchronization immediately
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", syncDriverUIState);
} else {
    syncDriverUIState();
}


// =========================================================================
// 📝 2. YOUR ORIGINAL REGISTRATION MECHANICS ENGINE (Kept completely identical)
// =========================================================================
document.addEventListener("DOMContentLoaded", () => {
    let driversDatabase = JSON.parse(localStorage.getItem("driversDatabase")) || [];
    const registrationForm = document.getElementById("registrationForm");

    if (registrationForm) {
        registrationForm.addEventListener("submit", (e) => {
            e.preventDefault(); 

            const username = document.getElementById("username").value.trim();
            const email = document.getElementById("email").value.trim();
            const password = document.getElementById("password").value;
            const confirmPassword = document.getElementById("confirmPassword").value;

            if (password !== confirmPassword) {
                alert("Security Error: Passwords do not match.");
                return;
            }

            const profileExists = driversDatabase.some(user => user.username.toLowerCase() === username.toLowerCase());
            if (profileExists) {
                alert("Registry Error: This username is already assigned to a profile.");
                return;
            }

            const newDriverProfile = {
                username: username,
                email: email,
                password: password, 
                registeredAt: new Date().toISOString()
            };

            driversDatabase.push(newDriverProfile);
            localStorage.setItem("driversDatabase", JSON.stringify(driversDatabase));

            alert("Driver Profile Registered Successfully!");
            window.location.href = "login_HTML.html"; 
        });
    }

    // =========================================================================
    // 🔐 3. LOGIN AUTHENTICATION MECHANICS ENGINE
    // =========================================================================
    const loginForm = document.getElementById("loginForm");

    if (loginForm) {
        loginForm.addEventListener("submit", (e) => {
            e.preventDefault(); 

            const usernameInput = document.getElementById("username").value.trim();
            const passwordInput = document.getElementById("password").value;

            const validUser = driversDatabase.find(user => user.username.toLowerCase() === usernameInput.toLowerCase());

            if (validUser && validUser.password === passwordInput) {
                localStorage.setItem("activeDriverSession", validUser.username);
                alert(`Access Granted. Welcome back, ${validUser.username}!`);
                window.location.href = "G81_HTML.html"; // Redirects straight to your core dash page
            } else {
                alert("Access Denied: Invalid Access Control credentials.");
            }
        });
    }

    // =========================================================================
    // 🚪 4. PROFILE TERMINATION & DE-AUTHENTICATION ACTIONS
    // =========================================================================
    const logoutBtn = document.getElementById("logoutBtn");
    const deleteAccountBtn = document.getElementById("deleteAccountBtn");

    if (logoutBtn) {
        logoutBtn.addEventListener("click", (e) => {
            e.preventDefault();
            localStorage.removeItem("activeDriverSession"); 
            alert("Driver Session Terminated.");
            window.location.reload(); 
        });
    }

    if (deleteAccountBtn) {
        deleteAccountBtn.addEventListener("click", (e) => {
            e.preventDefault();
            if (confirm("Warning: Are you absolutely sure you want to permanently delete your driver profile? This action cannot be undone.")) {
                const activeDriver = localStorage.getItem("activeDriverSession");
                driversDatabase = driversDatabase.filter(user => user.username.toLowerCase() !== activeDriver.toLowerCase());
                localStorage.setItem("driversDatabase", JSON.stringify(driversDatabase));
                localStorage.removeItem("activeDriverSession");
                alert("Profile purged completely from registry files.");
                window.location.reload(); 
            }
        });
    }
});