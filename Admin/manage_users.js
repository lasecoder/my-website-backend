document.addEventListener("DOMContentLoaded", function() {
    const token = localStorage.getItem("admin-token");

    if (!token) {
        window.location.href = "admin_login.html";
    }

    // Fetch Users
    fetch("http://localhost:5000/api/admin/users", {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}`
        }
    })
    .then(response => response.json())
    .then(data => {
        const usersTable = document.getElementById("users-table").getElementsByTagName("tbody")[0];
        data.forEach(user => {
            let row = usersTable.insertRow();
            row.insertCell(0).textContent = user.name;
            row.insertCell(1).textContent = user.email;
            let deleteButton = document.createElement("button");
            deleteButton.textContent = "Delete";
            deleteButton.addEventListener("click", () => deleteUser(user._id));
            row.insertCell(2).appendChild(deleteButton);
        });
    })
    .catch(error => console.error("Error fetching users:", error));

    // Delete user
    function deleteUser(userId) {
        fetch(`http://localhost:5000/api/admin/users/${userId}`, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.message === "User deleted") {
                alert("User deleted");
                window.location.reload();
            }
        })
        .catch(error => console.error("Error deleting user:", error));
    }

    // Back Button
    document.getElementById("backBtn").addEventListener("click", () => {
        window.location.href = "admin_dashboard.html";
    });
});
