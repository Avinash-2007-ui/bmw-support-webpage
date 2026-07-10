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
    const textInput = document.getElementById('userDamageReport').value.trim();
    const outputDiv = document.getElementById('aiOutputView');
    
    if (!textInput) {
        alert("Please describe the damage before running the check.");
        return;
    }
    
    outputDiv.innerText = "Connecting to secure Java gateway...";
    
    try {
        const response = await fetch('http://localhost:5000/api/diagnose', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ description: textInput })
        });
        
        const data = await response.json();
        
        // DEBUG: Print the raw response data to your browser console to inspect it
        console.log("Raw Backend Response Data:", data);
        
        // 1. Check if Gemini returned a standard successful content response text block
        if (data.candidates && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0].text) {
            outputDiv.innerText = data.candidates[0].content.parts[0].text;
        } 
        // 2. Intercept Error responses for Presentation Fallback Mode
        else if (data.error || data.message) {
            const errorMessage = typeof data.error === 'object' 
                ? (data.error.message || "") 
                : (data.error || data.message || "");
            
            // If the endpoint is unavailable, rate limited, or experiencing high demand
            if (errorMessage.toLowerCase().includes("demand") || 
                errorMessage.toLowerCase().includes("limit") || 
                errorMessage.toLowerCase().includes("available")) {
                
                outputDiv.innerHTML = `<strong>⚠️ [Presentation Demo Mode Enabled - Google API Rate Limited]</strong>\n\n` + 
                                      `<strong>BMW Core Diagnostic Telemetry Baseline:</strong>\n` +
                                      `• Analysis Status: Localized Baseline Rule-Check\n` +
                                      `• User Report Log: "${textInput}"\n` +
                                      `• Recommended Action: Check fluid pressure, inspect physical alignment parameters, and scan the OBD-II module for diagnostic trouble codes (DTCs).`;
            } else {
                outputDiv.innerText = "Backend Error: " + errorMessage;
            }
        }
        else {
            outputDiv.innerText = "Response received, but format structure was unrecognized. Check browser console (F12).";
        }
    } catch (err) {
        console.error("Connection failed:", err);
        outputDiv.innerText = "Could not reach the backend server. Verify your terminal JRE session is still running on port 5000.";
    }
}
function toggleBmwSidePanel() {
    const panel = document.getElementById('bmwAiSidePanel');
    const toggleBtn = document.getElementById('bmwAiToggleBtn');
    
    // Force a default check if the style layout property is empty or uninitialized
    if (!panel.style.right || panel.style.right === '-400px') {
        panel.style.right = '0px'; // Slide in gracefully
        toggleBtn.style.transform = 'rotate(90deg)';
    } else {
        panel.style.right = '-400px'; // Slide back out
        toggleBtn.style.transform = 'rotate(0deg)';
    }
}