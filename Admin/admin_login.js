document.getElementById("login-form").addEventListener("submit", function(e) {
    e.preventDefault();
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    // Perform login request to backend
    fetch("http://localhost:5000/admin/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Save token to localStorage and redirect to dashboard
            localStorage.setItem("admin-token", data.token);
            window.location.href = "admin_dashboard.html";
        } else {
            alert("Invalid credentials");
        }
    })
    .catch(error => {
        console.error("Error logging in:", error);
    });
});
