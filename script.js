document.getElementById("lotto-form").addEventListener("submit", function (e) {
  e.preventDefault();

  const inputs = Array.from(document.querySelectorAll(".input-row input")).map(i => +i.value.trim());
  const strong = +document.getElementById("strong").value.trim();
  const resultDiv = document.getElementById("result");

  if (
    inputs.length !== 6 ||
    inputs.some(n => n < 1 || n > 37 || isNaN(n)) ||
    strong < 1 || strong > 7 || isNaN(strong)
  ) {
    resultDiv.textContent = "⚠️ Please enter 6 valid numbers (1–37) and a strong number (1–7)";
    resultDiv.classList.remove("match");
    return;
  }

  fetch("lotto.json")
    .then(r => r.json())
    .then(data => {
      const match = data.find(draw => {
        if (!Array.isArray(draw)) return false;

        const drawNums = draw.slice(2, 8).map(Number);
        const drawStrong = +draw[8];

        const allExist = inputs.every(n => drawNums.includes(n));
        return allExist && drawStrong === strong;
      });

      if (match) {
        resultDiv.textContent = `🎉 המספרים שלך עלו! הגרלה מספר ${match[0]} בתאריך ${match[1]}`;
        resultDiv.classList.add("match");
      } else {
        resultDiv.textContent = "❌ לא נמצאה התאמה. אולי בפעם הבאה 🎯";
        resultDiv.classList.remove("match");
      }
    })
    .catch(err => {
      console.error("❌ Error:", err);
      resultDiv.textContent = "שגיאה בטעינת הנתונים 😞";
    });
});
