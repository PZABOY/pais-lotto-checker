document.getElementById("lotto-form").addEventListener("submit", function(e) {
  e.preventDefault();
  const inputs = Array.from(document.querySelectorAll(".inputs input")).map(i => +i.value.trim());
  const strong = +document.getElementById("strong").value.trim();
  const resultDiv = document.getElementById("result");

  if (inputs.length !== 6 || inputs.some(n => n < 1 || n > 37) || strong < 1 || strong > 7) {
    resultDiv.textContent = "⚠️ אנא הזן 6 מספרים תקינים ומספר חזק בין 1 ל־7";
    return;
  }

  fetch('lotto.json')
    .then(r => r.json())
    .then(data => {
      const match = data.find(draw => {
        const drawNums = draw.slice(2, 8).map(Number);
        const drawStrong = +draw[8];
        return inputs.every(n => drawNums.includes(n)) && drawStrong === strong;
      });

      resultDiv.textContent = match
        ? `🎉 המספרים שלך הופיעו בהגרלה מספר ${match[0]} בתאריך ${match[1]}`
        : "❌ לא נמצאה התאמה. נסה שוב או תחשוב על טוטו.";
    });
});

function share() {
  const url = window.location.href;
  if (navigator.share) {
    navigator.share({ title: document.title, url });
  } else {
    navigator.clipboard.writeText(url);
    alert("🔗 הקישור הועתק לשיתוף!");
  }
}
