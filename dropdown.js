// Dropdown toggle functionality
document.addEventListener("DOMContentLoaded", () => {
    const avatarTrigger = document.getElementById("avatarTrigger");
    const avatarDropdown = document.getElementById("avatarDropdown");

    if (avatarTrigger && avatarDropdown) {
        // Toggle dropdown on avatar click
        avatarTrigger.addEventListener("click", (e) => {
            e.stopPropagation();
            avatarDropdown.classList.toggle("active");
        });

        // Close dropdown when clicking outside
        document.addEventListener("click", (e) => {
            if (!avatarTrigger.contains(e.target) && !avatarDropdown.contains(e.target)) {
                avatarDropdown.classList.remove("active");
            }
        });

        // Close dropdown when clicking a link inside it
        const dropdownLinks = avatarDropdown.querySelectorAll("a");
        dropdownLinks.forEach(link => {
            link.addEventListener("click", () => {
                avatarDropdown.classList.remove("active");
            });
        });
    }
});

async function runSystemCheck() {
    // 1. Try to find the desktop text area first; if null, look for the mobile layout variation
    const inputElement = document.getElementById('userDamageReport') || document.querySelector('.mobile-damage-input');
    
    if (!inputElement) {
        console.error("Critical Frontend Error: Could not locate the input text box element in the current layout view.");
        return;
    }

    const textInput = inputElement.value.trim();
    const outputDiv = document.getElementById('aiOutputView');
    
    if (!textInput) {
        alert("Please describe the damage before running the check.");
        return;
    }
    
    outputDiv.innerText = "Connecting to secure Java gateway...";
    
    // ... rest of your fetch code stays exactly the same ...
    
   try {
        const response = await fetch('https://bmw-support-webpage.onrender.com/api/diagnose', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ description: textInput })
        }); 
        
        // NEW DIAGNOSTIC ALERT: See the exact HTTP response code
        console.log("HTTP Response Status:", response.status);
        if (response.status !== 200) {
            outputDiv.innerText = `Server returned HTTP Status: ${response.status}. Waiting for cold boot or fixing endpoint error.`;
            return;
        }
        
        const data = await response.json();
        console.log("Raw Backend Response Data:", data);

        let aiTextResponse = "";
        if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
            aiTextResponse = data.candidates[0].content.parts[0].text;
        } else if (data.text) {
            aiTextResponse = data.text;
        } else if (data.content && typeof data.content === 'string') {
            aiTextResponse = data.content;
        }

        if (aiTextResponse) {
            outputDiv.innerText = aiTextResponse;
        } 
        else if (data.error) {
            const errorStr = typeof data.error === 'object' ? (data.error.message || JSON.stringify(data.error)) : data.error;
            // Print the actual backend error on screen so we can read it!
            outputDiv.innerText = "Actual Backend Error: " + errorStr;
        } 
        else {
            outputDiv.innerText = "Raw Response Object: " + JSON.stringify(data);
        }
    } catch (err) {
        console.error("Connection failed:", err);
        outputDiv.innerText = "Could not reach the backend server.";
    }
}

// Clean helper function to render the fallback card cleanly if needed
function triggerDemoMode(textInput, outputDiv) {
    outputDiv.innerHTML = `<strong>⚠️ [Presentation Demo Mode Enabled - Google API Rate Limited]</strong>\n\n` + 
                          `<strong>BMW Core Diagnostic Telemetry Baseline:</strong>\n` +
                          `• Analysis Status: Localized Baseline Rule-Check\n` +
                          `• User Report Log: "${textInput}"\n` +
                          `• Recommended Action: Check fluid pressure, inspect physical alignment parameters, and scan the OBD-II module for diagnostic trouble codes (DTCs).`;
}


function toggleBmwSidePanel() {
    const panel = document.getElementById('bmwAiSidePanel');
    const toggleBtn = document.getElementById('bmwAiToggleBtn');
    
    // Force a default check if the style layout property is empty or uninitialized
    if (!panel.style.right || panel.style.right === '-600px') {
        panel.style.right = '0px'; // Slide in gracefully
        toggleBtn.style.transform = 'rotate(90deg)';
    } else {
        panel.style.right = '-600px'; // Slide back out
        toggleBtn.style.transform = 'rotate(0deg)';
    }
}