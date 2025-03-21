const backendUrl = "https://my-backend-service.onrender.com"; // Replace with your backend URL

async function updateContent(section, title, description, image = null) {
  try {
    const formData = new FormData();
    formData.append("section", section);

    if (section === "footer") {
      formData.append("footerText", description); // Correctly append footer text
    } else {
      formData.append("title", title);
      formData.append("description", description);
      if (image) formData.append("image", image);
    }

    console.log("📤 Sending data to server:", {
      section,
      title,
      description,
      footerText: description,  // Log footerText explicitly
      image: image ? image.name : "No image",
    });

    const response = await fetch(`${backendUrl}/api/content`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) throw new Error("Failed to update content");

    const data = await response.json();
    console.log("✅ Server response:", data);
    alert(`${section} updated successfully!`);
  } catch (error) {
    console.error("❌ Error updating content:", error);
    alert("Error updating content: " + error.message);
  }
}

document.addEventListener("DOMContentLoaded", function () {
  const updateService1Button = document.getElementById("update-service1-btn");
  const updateHeaderButton = document.getElementById("update-header-btn");
  const updateFooterButton = document.getElementById("update-footer-btn");

  // Handle Service 1 Update
  if (updateService1Button) {
    updateService1Button.addEventListener("click", async (e) => {
      e.preventDefault();

      const title = document.getElementById("service1-title").value;
      const description = document.getElementById("service1-description").value;
      const image = document.getElementById("service1-image").files[0];

      if (!title || !description) {
        alert("Please fill in all required fields.");
        return;
      }

      await updateContent("services", title, description, image);
    });
  }

  // Handle Header Update
  if (updateHeaderButton) {
    updateHeaderButton.addEventListener("click", async (e) => {
      e.preventDefault();

      const title = document.getElementById("home-header-title").value;
      const image = document.getElementById("home-header-image").files[0];

      if (!title) {
        alert("Please enter a header title.");
        return;
      }

      await updateContent("header", title, "", image);
    });
  }

  // Handle Footer Update
  if (updateFooterButton) {
    updateFooterButton.addEventListener("click", async (e) => {
      e.preventDefault();

      const footerText = document.getElementById("home-footer-text").value;

      if (!footerText) {
        alert("Please enter footer text.");
        return;
      }

      await updateContent("footer", "", footerText); // Just send footer text for footer section
    });
  }
});