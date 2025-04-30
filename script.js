// Handle form submission
document.getElementById("lotto-form").addEventListener("submit", function (e) {
  e.preventDefault();

  // Get user input values
  const inputs = Array.from(document.querySelectorAll(".input-group.row input")).map(i => +i.value.trim());
  const strong = +document.getElementById("strong").value.trim();
  const resultDiv = document.getElementById("result");

  resultDiv.classList.remove("match"); // Clear any previous match styling

  // Basic validation
  if (inputs.length !== 6 || inputs.some(n => n < 1 || n > 37) || strong < 1 || strong > 7) {
    resultDiv.textContent = "⚠️ Please enter 6 valid numbers (1–37) and a strong number (1–7)";
    return;
  }

  // Fetch and check lotto results
  fetch("lotto.json")
    .then(r => r.json())
    .then(data => {
      const match = data.find(draw => {
        const drawNums = draw.slice(2, 8).map(Number); // Main numbers
        const drawStrong = +draw[8]; // Strong number
        return inputs.every(n => drawNums.includes(n)) && drawStrong === strong;
      });

      if (match) {
        resultDiv.textContent = `🎉 Your numbers matched draw #${match[0]} on ${match[1]}!`;
        resultDiv.classList.add("match"); // Optional glow effect
      } else {
        resultDiv.textContent = "❌ No match found. Try again or play something else.";
      }
    });
});

// Share to social platforms
function shareTo(platform) {
  const url = encodeURIComponent(window.location.href);
  const text = encodeURIComponent("Check if my numbers won the lottery 🎲");
  let shareUrl = "";

  switch (platform) {
    case "whatsapp":
      shareUrl = `https://wa.me/?text=${text}%20${url}`;
      break;
    case "facebook":
      shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
      break;
    case "twitter":
      shareUrl = `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
      break;
  }

  if (shareUrl) {
    window.open(shareUrl, "_blank");
  }
}

// Copy link to clipboard
function copyLink() {
  navigator.clipboard.writeText(window.location.href);
  alert("🔗 Link copied to clipboard!");
}
