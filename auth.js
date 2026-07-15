document.addEventListener("DOMContentLoaded", () => {
    console.log("DEBUG: Active Session Status ->", localStorage.getItem("activeDriverSession"));
    
    // Automatically initialize database if blank
    if (!localStorage.getItem("driversDatabase")) {
        localStorage.setItem("driversDatabase", JSON.stringify([]));
    }

    const activeDriver = localStorage.getItem("activeDriverSession");
    let driversDatabase = JSON.parse(localStorage.getItem("driversDatabase")) || [];

    // Select menu elements
    const loginLink = document.getElementById("loginLink");
    const registerLink = document.getElementById("registerLink");
    const driverHeader = document.getElementById("driverHeader");
    const dropdownUsername = document.getElementById("dropdownUsername");
    const settingsLink = document.getElementById("settingsLink");
    const deleteAccountBtn = document.getElementById("deleteAccountBtn");
    const logoutBtn = document.getElementById("logoutBtn");
    const avatarText = document.querySelector(".avatar-text");
    
    // Select form and action triggers
    const registrationForm = document.getElementById("registrationForm");
    const loginForm = document.getElementById("loginForm");

    // =========================================================================
    // 🎛️ UPDATE DROPDOWN MENU BASED ON AUTH STATE
    // =========================================================================
    function updateDropdownMenu() {
        const currentDriver = localStorage.getItem("activeDriverSession");
        
        if (currentDriver) {
            // User is logged in - show authenticated menu
            if (loginLink) loginLink.style.display = "none";
            if (registerLink) registerLink.style.display = "none";
            if (driverHeader) driverHeader.style.display = "block";
            if (settingsLink) settingsLink.style.display = "block";
            if (deleteAccountBtn) deleteAccountBtn.style.display = "block";
            if (logoutBtn) logoutBtn.style.display = "block";
            if (dropdownUsername) dropdownUsername.textContent = currentDriver;
            
            // Update avatar with initials
            if (avatarText) {
                const initials = currentDriver.trim().split(" ").map(n => n[0]).join("").toUpperCase();
                avatarText.textContent = initials.substring(0, 2);
            }
        } else {
            // User is guest - show login/register menu
            if (loginLink) loginLink.style.display = "block";
            if (registerLink) registerLink.style.display = "block";
            if (driverHeader) driverHeader.style.display = "none";
            if (settingsLink) settingsLink.style.display = "none";
            if (deleteAccountBtn) deleteAccountBtn.style.display = "none";
            if (logoutBtn) logoutBtn.style.display = "none";
            if (avatarText) avatarText.textContent = "AV";
        }
    }

    // Initialize dropdown on page load
    updateDropdownMenu();

    // =========================================================================
    // 🔐 RESET LOGIN HANDLER (No Race Conditions, Direct Fetch)
    // =========================================================================
    if (loginForm) {
        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault(); 
            const usernameInput = document.getElementById("username").value.trim();
            const passwordInput = document.getElementById("password").value;
            
            // 1. Admin Backdoor Check
            if (usernameInput === "admin_m_power" && passwordInput === "bmw2026") {
                localStorage.setItem("activeDriverSession", "Admin (M-Power)");
                localStorage.setItem("currentUser", JSON.stringify({ username: "Admin (M-Power)", email: "admin@bmwsupport.dedyn.io" }));
                
                try {
                    console.log("Sending Admin Login Mail...");
                    await fetch('https://bmw-support-webpage.onrender.com/api/login', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email: "admin@bmwsupport.dedyn.io" })
                    });
                } catch (err) {
                    console.error("Admin mail request failed:", err);
                }
                window.location.href = "index.html"; 
                return; 
            }

            // 2. Normal Database Check
            const validUser = driversDatabase.find(user => user.username.toLowerCase() === usernameInput.toLowerCase());

            if (validUser && validUser.password === passwordInput) {
                localStorage.setItem("activeDriverSession", validUser.username);
                localStorage.setItem("currentUser", JSON.stringify(validUser));

                // 3. Trigger Email Alert and WAIT until it finishes
                console.log("Attempting to send login email to:", validUser.email);
                try {
                    const response = await fetch('https://bmw-support-webpage.onrender.com/api/login', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email: validUser.email.trim() })
                    });
                    console.log("Server responded to login mail request with status:", response.status);
                } catch (err) {
                    console.error("Network error during login mail fetch:", err);
                }

                window.location.href = "index.html"; 
            } else {
                const alertBox = document.getElementById("custom-alert");
                if (alertBox) {
                    alertBox.classList.remove("hidden-modal");
                } else {
                    console.error("Custom alert box missing!");
                }
            }
        });
    }

    // =========================================================================
    // 📝 STRICT REGISTRATION HANDLER
    // =========================================================================
    if (registrationForm) {
        registrationForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const username = document.getElementById("username").value.trim();
            const email = document.getElementById("email").value.trim();
            const password = document.getElementById("password").value;
            const confirmPassword = document.getElementById("confirmPassword").value;

            if (password !== confirmPassword) {
                alert("Passwords do not match.");
                return;
            }

            if (driversDatabase.some(user => user.username.toLowerCase() === username.toLowerCase())) {
                alert("Username is already taken.");
                return;
            }

            console.log("Attempting to verify registration with server for:", email);
            let apiSuccess = false;

            try {
                const response = await fetch('https://bmw-support-webpage.onrender.com/api/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: email })
                });

                if (response.status === 200 || response.status === 201) {
                    apiSuccess = true;
                } else {
                    console.warn("Backend rejected request or returned status:", response.status);
                }
            } catch (err) {
                console.error("Network infrastructure error during validation:", err);
            }

            if (apiSuccess) {
                driversDatabase.push({ username, email, password, registeredAt: new Date().toISOString() });
                localStorage.setItem("driversDatabase", JSON.stringify(driversDatabase));
                alert("Driver Profile Registered Successfully!");
                window.location.href = "login_HTML.html";
            } else {
                alert("Registration Service Delayed: Email verification gateway is currently initializing. Please check server status or try again shortly.");
            }
        });
    }
    // =========================================================================
    // 🚪 LOGOUT HANDLER
    // =========================================================================
    if (logoutBtn) {
        logoutBtn.addEventListener("click", (e) => {
            e.preventDefault();
            localStorage.removeItem("activeDriverSession");
            localStorage.removeItem("currentUser"); // Clean validation checkpoint
            alert("Driver Session Terminated.");
            updateDropdownMenu();
            window.location.href = "index.html"; 
        });
    }

    // =========================================================================
    // ⚠️ DELETE ACCOUNT HANDLER
    // =========================================================================
    if (deleteAccountBtn) {
        deleteAccountBtn.addEventListener("click", (e) => {
            e.preventDefault();
            const currentDriver = localStorage.getItem("activeDriverSession");
            if (!currentDriver) return;

            if (confirm("Warning: Permanently delete your profile? This action cannot be undone.")) {
                let db = JSON.parse(localStorage.getItem("driversDatabase")) || [];
                db = db.filter(user => user.username.toLowerCase() !== currentDriver.toLowerCase());
                localStorage.setItem("driversDatabase", JSON.stringify(db));
                localStorage.removeItem("activeDriverSession");
                localStorage.removeItem("currentUser");
                alert("Profile purged completely.");
                window.location.href = "index.html";
            }
        });
    }

    // =========================================================================
    // 🚨 CUSTOM MODAL CLOSE FUNCTION (Must be global)
    // =========================================================================
    window.closeAlert = function() {
        const alertBox = document.getElementById("custom-alert");
        if (alertBox) {
            alertBox.classList.add("hidden-modal");
        }
    };
});