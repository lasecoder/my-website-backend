document.addEventListener("DOMContentLoaded", function() {
    const token = localStorage.getItem("admin-token");

    if (!token) {
        window.location.href = "admin_login.html";
    }

    // Back Button
    document.getElementById("backBtn").addEventListener("click", () => {
        window.location.href = "admin_dashboard.html";
    });

    // Submit form to update content
    document.getElementById("modify-content-form").addEventListener("submit", function(e) {
        e.preventDefault();

        const headerText = document.getElementById("header-text").value;
        const footerText = document.getElementById("footer-text").value;

        // Update content request to backend
        fetch("http://localhost:5000/api/admin/content", {
            method: "PUT",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ headerText, footerText })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert("Content updated successfully!");
            }
        })
        .catch(error => console.error("Error updating content:", error));
    });
});
