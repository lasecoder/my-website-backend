 // Function to preview the uploaded image
 function previewImage(event, previewId) {
    const reader = new FileReader();
    reader.onload = function () {
        const preview = document.getElementById(previewId);
        preview.src = reader.result;
    };
    reader.readAsDataURL(event.target.files[0]);
}

// Function to save changes to localStorage
function saveChanges() {
    const aboutUsData = {
        headerText: document.getElementById("headerText").value,
        contentText: document.getElementById("contentText").value,
        missionText: document.getElementById("missionText").value,
        teamMembers: [
            {
                name: document.getElementById("team1-name").value,
                role: document.getElementById("team1-role").value,
                imageSrc: document.getElementById("team1-preview").src
            },
            {
                name: document.getElementById("team2-name").value,
                role: document.getElementById("team2-role").value,
                imageSrc: document.getElementById("team2-preview").src
            },
            {
                name: document.getElementById("team3-name").value,
                role: document.getElementById("team3-role").value,
                imageSrc: document.getElementById("team3-preview").src
            }
        ],
        contactInfo: {
            address: document.getElementById("contact-address").value,
            phone: document.getElementById("contact-phone").value,
            email: document.getElementById("contact-email").value,
            twitter: document.getElementById("contact-twitter").value,
            facebook: document.getElementById("contact-facebook").value,
            linkedin: document.getElementById("contact-linkedin").value
        }
    };

    localStorage.setItem("aboutUsData", JSON.stringify(aboutUsData));
    alert("Changes saved successfully!");
}