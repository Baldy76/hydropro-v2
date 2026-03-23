// Ensure this specific line is in your openTab function to handle the active state visually
window.openTab = function(evt, name) {
    const contents = document.getElementsByClassName("tab-content");
    const tabs = document.getElementsByClassName("tab");
    for (let i = 0; i < contents.length; i++) contents[i].classList.remove("active");
    for (let i = 0; i < tabs.length; i++) tabs[i].classList.remove("active");
    
    document.getElementById(name).classList.add("active");
    if (evt) evt.currentTarget.classList.add("active");
    
    // Refresh data for the tab
    renderAll();
    window.scrollTo(0,0);
};

// ... [Remainder of app.js from v8.5 is identical] ...
