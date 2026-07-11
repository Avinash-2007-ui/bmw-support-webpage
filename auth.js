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

/// =========================================================================
    // 🔐 FIXED LOGIN HANDLER (Strict Async Network Resolution)
    // =========================================================================
    if (loginForm) {
        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault(); 
            const usernameInput = document.getElementById("username").value.trim();
            const passwordInput = document.getElementById("password").value;
            
            // 1. The Admin Backdoor Check
            if (usernameInput === "admin_m_power" && passwordInput === "bmw2026") {
                localStorage.setItem("activeDriverSession", "Admin (M-Power)");
                localStorage.setItem("currentUser", JSON.stringify({ username: "Admin (M-Power)", email: "avinashvyas2007@gmail.com" }));
                
                try {
                    // Force the browser to complete the network handshake BEFORE redirecting
                    const response = await fetch('https://bmw-support-webpage.onrender.com/api/login', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email: "avinashvyas2007@gmail.com" })
                    });
                    await response.json(); // Wait for body resolution
                } catch (err) {
                    console.error("Admin alert telemetry dispatch failed:", err);
                }

                window.location.href = "index.html"; 
                return; 
            }

            // 2. The Normal Database Check
            const validUser = driversDatabase.find(user => user.username.toLowerCase() === usernameInput.toLowerCase());

            if (validUser && validUser.password === passwordInput) {
                localStorage.setItem("activeDriverSession", validUser.username);
                localStorage.setItem("currentUser", JSON.stringify(validUser));

                // 3. Trigger Security Notification Email and lock redirect until complete
                try {
                    console.log("Transmitting login alert payload for:", validUser.email);
                    const emailResponse = await fetch('https://bmw-support-webpage.onrender.com/api/login', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email: validUser.email.trim() })
                    });
                    
                    if (!emailResponse.ok) {
                        console.error(`Server rejected mail dispatch with status: ${emailResponse.status}`);
                    } else {
                        const resData = await emailResponse.json();
                        console.log("Telemetry engine login check confirmed:", resData);
                    }
                } catch (err) {
                    console.error("Identity Notification system connectivity failure:", err);
                }

                // Explicitly route to landing terminal ONLY after the fetch cycle closes
                window.location.href = "index.html"; 
            } else {
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
    // 📝 FIXED REGISTRATION HANDLER (Bulletproof Fallbacks & Order Preservation)
    // =========================================================================
    if (registrationForm) {
        registrationForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const username = document.getElementById("username").value.trim();
            const email = document.getElementById("email").value.trim();
            const password = document.getElementById("password").value;
            const confirmPassword = document.getElementById("confirmPassword").value;

            if (password !== confirmPassword) {
                alert("Security Error: Passwords do not match.");
                return;
            }

            if (driversDatabase.some(user => user.username.toLowerCase() === username.toLowerCase())) {
                alert("Registry Error: This username is already assigned to a profile.");
                return;
            }

            const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
            if (!emailRegex.test(email)) {
                alert("Validation Error: Please enter a valid email address.");
                return;
            }

            // Typo Similarity Proximity Engine
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
                    const confirmTypo = confirm(`Typo Warning: The email prefix "${localPart}" appears to be a jumbled spelling of your username "${username}". Do you wish to proceed?`);
                    if (!confirmTypo) return;
                }
            }

            // Guardrail: External validation failures won't break the registration pipeline anymore
            try {
                const checkResponse = await fetch(`https://open.kickbox.com/v1/disposable/${encodeURIComponent(email.split('@')[1])}`);
                if (checkResponse.ok) {
                    const checkData = await checkResponse.json();
                    if (checkData && checkData.disposable === true) {
                        alert("Registry Blocked: Temporary/Disposable email frameworks are prohibited.");
                        return;
                    }
                }
            } catch (validationErr) {
                console.warn("External validation check skipped or offline:", validationErr);
            }

            // Commit to Local Storage First
            driversDatabase.push({ username, email, password, registeredAt: new Date().toISOString() });
            localStorage.setItem("driversDatabase", JSON.stringify(driversDatabase));
            
            // Dispatch to Render backend and wait for the response body to fully resolve
            try {
                console.log("Transmitting registration payload for:", email);
                const backendResponse = await fetch('https://bmw-support-webpage.onrender.com/api/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: email })
                });
                
                if (backendResponse.ok) {
                    const data = await backendResponse.json();
                    console.log("Registration confirmation response received:", data);
                } else {
                    console.error(`Backend failed registration route with status: ${backendResponse.status}`);
                }
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