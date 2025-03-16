document.addEventListener("DOMContentLoaded", function() {
    const token = localStorage.getItem("admin-token");

    if (!token) {
        window.location.href = "admin_login.html";
    }

    // Fetch Contact Messages
    fetch("http://localhost:3000/api/admin/contacts", {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}`
        }
    })
    .then(response => response.json())
    .then(data => {
        const contactTable = document.getElementById("contact-table").getElementsByTagName("tbody")[0];
        data.forEach(contact => {
            let row = contactTable.insertRow();
            row.insertCell(0).textContent = contact.name;
            row.insertCell(1).textContent = contact.email;
            row.insertCell(2).textContent = contact.message;
            let deleteButton = document.createElement("button");
            deleteButton.textContent = "Delete";
            deleteButton.addEventListener("click", () => deleteContact(contact._id));
            row.insertCell(3).appendChild(deleteButton);
        });
    })
    .catch(error => console.error("Error fetching contact messages:", error));

    // Delete Contact
    function deleteContact(contactId) {
        fetch(`http://localhost:3000/api/admin/contacts/${contactId}`, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.message === "Message deleted") {
                alert("Message deleted");
                window.location.reload();
            }
        })
        .catch(error => console.error("Error deleting message:", error));
    }

    // Back Button
    document.getElementById("backBtn").addEventListener("click", () => {
        window.location.href = "admin_dashboard.html";
    });
});
