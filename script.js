"use strict";

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
  updateData();
}

// 🌐 Client-side fetch & processing
fetch("data/lotto.json")
  .then((r) => r.json())
  .then((data) => {
    rawLottoData = (data.results || []).filter(draw => typeof draw === 'object' && draw["1"]);
    console.log("✅ Loaded:", rawLottoData.length, "draws");

    lottoNumbersSince2009 = rawLottoData
      .filter((draw) => {
        const dateStr = draw["תאריך"];
        const year = new Date(dateStr).getFullYear();
        return year >= 2009;
      })
      .map((draw) => [draw["1"], draw["2"], draw["3"], draw["4"], draw["5"], draw["6"]].map((n) => parseInt(n, 10)));

    console.log("📆 From 2009:", lottoNumbersSince2009.length, "draws");
  })
  .catch((err) => {
    console.error("❌ Failed to load lotto data:", err);
  });

// 🧠 Check user's numbers for a match
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
    if (!draw || typeof draw !== 'object') return false;

    const drawNums = [draw["1"], draw["2"], draw["3"], draw["4"], draw["5"], draw["6"]].map(n => parseInt(n, 10));
    const drawStrong = parseInt(draw["המספר החזק/נוסף"], 10);

    const allExist = inputs.every(n => drawNums.includes(n));
    return allExist && drawStrong === strong;
  });

  if (match) {
    resultDiv.textContent = `איזה באסה המספרים שלך כבר זכו! הגרלה מספר ${match["הגרלה"]} בתאריך ${match["תאריך"]}`;
    resultDiv.classList.add("match");
  } else {
    resultDiv.textContent = "וואלה הם מעולם לא נתנו במזל, אולי בפעם הבאה?";
    resultDiv.classList.remove("match");
  }
}

// 🎂 Display luck based on user's birthdate
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

  resultBox.innerHTML = ` <br>${resultHTML}<br><small>* מבוסס על הגרלות מ־2009</small>`;
}

// ⚙️ Client-side event handlers
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("lotto-form");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      checkMyNumbers();
    });
  }

  const checkLuckBtn = document.getElementById("checkLuckBtn");
  if (checkLuckBtn) {
    checkLuckBtn.addEventListener("click", () => {
      if (typeof displayLuck === "function") displayLuck();
    });
  }

  const copyBtn = document.getElementById("copyBtn");
  if (copyBtn) {
    copyBtn.addEventListener("click", () => {
      navigator.clipboard.writeText(window.location.href).then(() => {
        alert("📎 הקישור הועתק!");
      });
    });
  }

  const yearSpan = document.getElementById("year");
  if (yearSpan) {
    yearSpan.textContent = new Date().getFullYear();
  }
});
