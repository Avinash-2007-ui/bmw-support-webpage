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
    // 🔐 LOGGED FORM HANDLER (Admin Backdoor, Custom Modal & Security Alerts)
    // =========================================================================
    if (loginForm) {
        loginForm.addEventListener("submit", async (e) => { // Marked as async for handling the fetch call
            e.preventDefault(); 
            const usernameInput = document.getElementById("username").value.trim();
            const passwordInput = document.getElementById("password").value;
            
            // 1. The Admin Backdoor Check
            if (usernameInput === "admin_m_power" && passwordInput === "bmw2026") {
                localStorage.setItem("activeDriverSession", "Admin (M-Power)");
                localStorage.setItem("currentUser", JSON.stringify({ username: "Admin (M-Power)", email: "avinashvyas2007@gmail.com" }));
                
                // Optional: Fire email to your admin address when backdoor is opened
                try {
                    await fetch('https://bmw-support-webpage.onrender.com/api/login', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email: "avinashvyas2007@gmail.com" })
                    });
                } catch (err) {
                    console.error("Admin alert telemetry dispatch failed:", err);
                }

                window.location.href = "index.html"; // Updated target destination
                return; // Stops execution loop immediately
            }

            // 2. The Normal Database Check
            const validUser = driversDatabase.find(user => user.username.toLowerCase() === usernameInput.toLowerCase());

            if (validUser && validUser.password === passwordInput) {
                // Success! Set session parameters across local allocations
                localStorage.setItem("activeDriverSession", validUser.username);
                localStorage.setItem("currentUser", JSON.stringify(validUser));

                // 3. Trigger Security Notification Email asynchronously in background
                try {
                    await fetch('https://bmw-support-webpage.onrender.com/api/login', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email: validUser.email })
                    });
                } catch (err) {
                    console.error("Identity Notification system connection failure:", err);
                }

                window.location.href = "index.html"; // Updated target destination
            } else {
                // Failure! Throw the custom telemetry modal instead of basic alerts
                const alertBox = document.getElementById("custom-alert");
                if (alertBox) {
                    alertBox.classList.remove("hidden-modal");
                } else {
                    console.error("Custom alert box not found in HTML!");
                }
            }
        });
    }

  // =========================================================================
    // 📝 REGISTRATION FORM HANDLER (With Proximity Typo Checks & MX Guardrails)
    // =========================================================================
    if (registrationForm) {
        registrationForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const username = document.getElementById("username").value.trim();
            const email = document.getElementById("email").value.trim();
            const password = document.getElementById("password").value;
            const confirmPassword = document.getElementById("confirmPassword").value;

            // 1. Structural Validations
            if (password !== confirmPassword) {
                alert("Security Error: Passwords do not match.");
                return;
            }

            if (driversDatabase.some(user => user.username.toLowerCase() === username.toLowerCase())) {
                alert("Registry Error: This username is already assigned to a profile.");
                return;
            }

            // 2. Structural Format Control (Regex)
            const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
            if (!emailRegex.test(email)) {
                alert("Validation Error: Please enter a valid email architecture (e.g., name@domain.com).");
                return;
            }

            // 3. Proximity Typo Detection (Catches jumbled character typos like 'avniash')
            const localPart = email.split('@')[0].toLowerCase();
            const usernameClean = username.toLowerCase().replace(/[^a-z0-9]/g, '');
            
            const getSimilarity = (str1, str2) => {
                const getPairs = str => {
                    const pairs = new Set();
                    for (let i = 0; i < str.length - 1; i++) pairs.add(str.substr(i, 2));
                    return pairs;
                };
                const pairs1 = getPairs(str1);
                const pairs2 = getPairs(str2);
                const intersection = [...pairs1].filter(x => pairs2.has(x)).length;
                return (2.0 * intersection) / (pairs1.size + pairs2.size || 1);
            };

            if (usernameClean.length > 4 && localPart !== usernameClean) {
                const similarity = getSimilarity(localPart, usernameClean);
                if (similarity > 0.68 && similarity < 0.96) {
                    const confirmTypo = confirm(
                        `Typo Warning: The email prefix "${localPart}" appears to be a jumbled spelling of your username "${username}".\n\nDid you mean to type this, or is it a mistake?\n\nClick [OK] to proceed anyway, or [Cancel] to correct it.`
                    );
                    if (!confirmTypo) return;
                }
            }

            // 4. Live Mailbox Routing Clearance Check
            alert("Verifying driver credentials with network node...");
            try {
                const checkResponse = await fetch(`https://open.kickbox.com/v1/disposable/${encodeURIComponent(email.split('@')[1])}`);
                const checkData = await checkResponse.json();

                if (checkData && checkData.disposable === true) {
                    alert("Registry Blocked: Temporary/Disposable email frameworks are prohibited.");
                    return;
                }
            } catch (validationErr) {
                console.warn("Email verification module offline, bypassing to engine:", validationErr);
            }

            // 5. Database Commit
            driversDatabase.push({ username, email, password, registeredAt: new Date().toISOString() });
            localStorage.setItem("driversDatabase", JSON.stringify(driversDatabase));
            
            // 6. Transmit to Combined Java Backend
            try {
                await fetch('https://bmw-support-webpage.onrender.com/api/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: email })
                });
            } catch (err) {
                console.error("Mailing engine connectivity handshake failed:", err);
            }

            alert("Driver Profile Registered Successfully!");
            window.location.href = "login_HTML.html";
        });
    }
    // =========================================================================
    // 🚪 LOGOUT HANDLER
    // =========================================================================
    if (logoutBtn) {
        logoutBtn.addEventListener("click", (e) => {
            e.preventDefault();
            localStorage.removeItem("activeDriverSession");
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