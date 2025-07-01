document.addEventListener('DOMContentLoaded', () => {
  const promptInput = document.getElementById("prompt");
  const modelSelect = document.getElementById("model");
  const countSelect = document.getElementById("count");
  const aspectSelect = document.getElementById("aspect");
  const generateBtn = document.getElementById("generate");
  const gallery = document.getElementById("gallery");
  const toggleThemeBtn = document.getElementById("themeToggle");

  if (!generateBtn || !toggleThemeBtn) {
    console.error('One or more buttons not found:', { generateBtn, toggleThemeBtn });
    return;
  }

  if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark");
    console.log("Loaded dark mode from localStorage");
  } else {
    console.log("Loaded light mode from localStorage");
  }

  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const aspectRatios = {
    "1:1": { width: 768, height: 768 },
    "9:16": { width: 768, height: 1344 },
	"16:9": { width: 1344, height: 768 }
  };

  const modal = document.createElement("div");
  modal.className = "modal";
  const modalImg = document.createElement("img");
  modalImg.className = "modal-img";
  const closeBtn = document.createElement("button");
  closeBtn.className = "close-btn";
  closeBtn.textContent = "×";
  modal.appendChild(modalImg);
  modal.appendChild(closeBtn);
  document.body.appendChild(modal);

  generateBtn.addEventListener("click", async () => {
    console.log("Generate button clicked");
    const prompt = promptInput.value.trim();
    const model = modelSelect.value;
    const count = parseInt(countSelect.value);
    const aspect = aspectSelect.value;

    if (!prompt) {
      alert("Please enter a prompt.");
      return;
    }

    // Create loading message with GIF
    gallery.innerHTML = `
      <p class="loading-message">
        Generating images... This may take a moment for the model to load...
        <img src="./loading.gif" alt="Loading" class="loading-gif">
      </p>
    `;

    try {
      console.log(`Attempting to generate ${count} images with model: ${model}, aspect: ${aspect}`);
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt, model, count, aspect })
      });

      console.log(`Request to backend: Status ${res.status}, Status Text: ${res.statusText}`);

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || `Backend error: ${res.status} ${res.statusText}`);
      }

      const data = await res.json();
      const images = data.images.map(base64 => {
        const byteCharacters = atob(base64);
        const byteNumbers = new Uint8Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const blob = new Blob([byteNumbers], { type: 'image/png' });
        return URL.createObjectURL(blob);
      });

      gallery.innerHTML = ""; // Clear loading message and GIF
      images.forEach((src, index) => {
        const div = document.createElement("div");
        div.className = "gallery-item";

        const img = document.createElement("img");
        img.src = src;
        img.alt = `Generated image ${index + 1}`;

        const link = document.createElement("a");
        link.href = src;
        link.download = `ai-image-${index + 1}.png`;
        link.className = "download-btn";
        link.textContent = "⬇";

        div.appendChild(img);
        div.appendChild(link);
        gallery.appendChild(div);

        img.addEventListener("click", () => {
          modalImg.src = src;
          modal.classList.add("active");
        });
      });
    } catch (err) {
      gallery.innerHTML = `<p>Error: ${err.message}</p>`;
      console.error("Full error:", err);
    }
  });

  closeBtn.addEventListener("click", () => {
    console.log("Close button clicked");
    modal.classList.remove("active");
    modalImg.src = "";
  });

  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      console.log("Modal background clicked");
      modal.classList.remove("active");
      modalImg.src = "";
    }
  });

  toggleThemeBtn.addEventListener("click", () => {
    console.log("Theme toggle button clicked");
    document.body.classList.toggle("dark");
    const isDark = document.body.classList.contains("dark");
    localStorage.setItem("theme", isDark ? "dark" : "light");
    console.log(`Toggled to ${isDark ? "dark" : "light"} mode`);
  });
});