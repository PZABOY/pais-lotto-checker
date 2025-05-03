// ====================
// 🎯 Pais Lotto Checker – Full Auto Update & Frontend Logic
// ====================

let rawLottoData = [];
let lottoNumbersSince2009 = [];

// 🔁 Server-side auto update (only runs in Node.js)
if (typeof window === "undefined") {
  const fs = require("fs");
  const path = require("path");
  const csv = require("csv-parser");
  const axios = require("axios");
  const cron = require("node-cron");

  const csvUrl = "https://www.pais.co.il/download/lotto/archive.csv";
  const csvPath = path.join(__dirname, "data", "lotto.csv");
  const jsonPath = path.join(__dirname, "data", "lotto.json");

  async function updateData() {
    try {
      const response = await axios.get(csvUrl, { responseType: "stream" });
      const writer = fs.createWriteStream(csvPath);
      response.data.pipe(writer);

      writer.on("finish", () => {
        const output = [];
        fs.createReadStream(csvPath, { encoding: "utf8" })
          .pipe(csv())
          .on("headers", (headers) => {
            console.log("📌 Headers found:", headers);
          })
          .on("data", (row) => {
            const rowArray = Object.values(row).map((v) => v.toString().trim());
            if (rowArray.length >= 9) output.push(rowArray);
          })
          .on("end", () => {
            fs.writeFileSync(jsonPath, JSON.stringify(output, null, 2), "utf8");
            console.log(`✅ Converted ${output.length} rows from lotto.csv to lotto.json`);
          });
      });
    } catch (err) {
      console.error("❌ Failed to update lotto data:", err);
    }
  }

  cron.schedule("59 23 * * *", updateData);
  updateData(); // Run immediately on startup
}

// 🌐 Client-side fetch & processing
fetch("data/lotto.json")
  .then((r) => r.json())
  .then((data) => {
    rawLottoData = data.filter((draw) => Array.isArray(draw) && draw.length >= 9);
    console.log("✅ Loaded:", rawLottoData.length, "draws");

    lottoNumbersSince2009 = rawLottoData
      .filter((draw) => {
        const dateStr = draw[7];
        const year = new Date(dateStr).getFullYear();
        return year >= 2009;
      })
      .map((draw) => draw.slice(0, 6).map((n) => parseInt(n, 10)));

    console.log("📆 From 2009:", lottoNumbersSince2009.length, "draws");
  })
  .catch((err) => {
    console.error("❌ שגיאה בטעינת נתוני הלוטו:", err);
  });

// 🧠 זכייה במספרים
function checkMyNumbers() {
  const inputs = Array.from(document.querySelectorAll(".input-row input")).map(i => parseInt(i.value.trim(), 10));
  const strong = parseInt(document.getElementById("strong").value.trim(), 10);
  const resultDiv = document.getElementById("result");

  if (
    inputs.length !== 6 ||
    inputs.some(n => n < 1 || n > 37 || isNaN(n)) ||
    strong < 1 || strong > 7 || isNaN(strong)
  ) {
    resultDiv.textContent = "⚠️ אנא הכנס 6 מספרים תקפים (1–37) ומספר חזק (1–7)";
    resultDiv.classList.remove("match");
    return;
  }

  const match = rawLottoData.find(draw => {
    if (!Array.isArray(draw)) return false;

    const drawNums = draw.slice(0, 6).map(n => parseInt(n, 10));
    const drawStrong = parseInt(draw[8], 10);

    const allExist = inputs.every(n => drawNums.includes(n));
    return allExist && drawStrong === strong;
  });

  if (match) {
    resultDiv.textContent = `🎉 המספרים שלך עלו! הגרלה מספר ${match[6]} בתאריך ${match[7]}`;
    resultDiv.classList.add("match");
  } else {
    resultDiv.textContent = "❌ לא זכית. אולי בפעם הבאה!";
    resultDiv.classList.remove("match");
  }
}

// 🎂 מזל לפי תאריך לידה
function displayLuck() {
  const userBirthday = document.getElementById("birthdayInput").value;
  const resultBox = document.getElementById("luckResult");

  if (!userBirthday || lottoNumbersSince2009.length === 0) {
    resultBox.textContent = "⚠️ יש להזין תאריך תקף.";
    return;
  }

  const birthdayDate = new Date(userBirthday);
  const day = birthdayDate.getDate();
  const month = birthdayDate.getMonth() + 1;

  const dateNumbers = [day, month];
  const flatLottoNumbers = lottoNumbersSince2009.flat();
  const totalDrawn = flatLottoNumbers.length;

  const breakdown = dateNumbers.map((num) => {
    const count = flatLottoNumbers.filter((n) => n === num).length;
    const percentage = ((count / totalDrawn) * 100).toFixed(2);
    return { num, count, percentage };
  });

  const resultHTML = breakdown
    .map(
      (entry) =>
        `המספר <b>${entry.num}</b> הופיע <b>${entry.count}</b> פעמים (<b>${entry.percentage}%</b>)`
    )
    .join("<br>");

  resultBox.innerHTML = `📊 כך המספרים של יום ההולדת שלך הופיעו:<br>${resultHTML}<br><small>* מבוסס על הגרלות מ־2009</small>`;
}

// 🧪 חיבור כפתור Submit
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("lotto-form");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      checkMyNumbers();
    });
  }
});
