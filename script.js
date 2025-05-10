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

  // Ensure data directory exists
  if (!fs.existsSync(path.join(__dirname, "data"))) {
    fs.mkdirSync(path.join(__dirname, "data"));
  }

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
            fs.writeFileSync(jsonPath, JSON.stringify({ results: output }, null, 2), "utf8");
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
document.addEventListener("DOMContentLoaded", () => {
  fetch("data/lotto.json")
    .then((r) => r.json())
    .then((data) => {
      rawLottoData = (data.results || []).filter(draw => typeof draw === 'object' && draw["1"]);
      console.log("✅ Loaded:", rawLottoData.length, "draws");

      lottoNumbersSince2009 = rawLottoData
        .filter((draw) => {
          if (!draw["תאריך"]) return false;
          const dateStr = draw["תאריך"];
          try {
            const year = new Date(dateStr).getFullYear();
            return year >= 2009 && !isNaN(year);
          } catch (e) {
            return false;
          }
        })
        .map((draw) => {
          return ["1", "2", "3", "4", "5", "6"]
            .map(key => draw[key])
            .filter(n => n !== undefined)
            .map(n => parseInt(n, 10))
            .filter(n => !isNaN(n));
        })
        .filter(numbers => numbers.length === 6);

      console.log("📆 From 2009:", lottoNumbersSince2009.length, "draws");
      
      // Call statistics loading when data is ready
      loadStatistics(data);
    })
    .catch((err) => {
      console.error("❌ Failed to load lotto data:", err);
      document.getElementById("statistics").innerHTML = "⚠️ Unable to load statistics.";
    });

  // Form submission handler
  const form = document.getElementById("lotto-form");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      checkMyNumbers();
    });
  }

  // Birthday check button handler
  const checkLuckBtn = document.getElementById("checkLuckBtn");
  if (checkLuckBtn) {
    checkLuckBtn.addEventListener("click", () => {
      displayLuck();
    });
  }

  // Copy link button handler
  const copyBtn = document.getElementById("copyBtn");
  if (copyBtn) {
    copyBtn.addEventListener("click", () => {
      navigator.clipboard.writeText(window.location.href).then(() => {
        alert("📎 הקישור הועתק!");
      });
    });
  }

  // Current year for footer
  const yearSpan = document.getElementById("year");
  if (yearSpan) {
    yearSpan.textContent = new Date().getFullYear();
  }
  
  // Smooth scrolling animation
  setTimeout(() => {
    const elements = document.querySelectorAll('.container, form, .birthday-section, .share, .stats-section, footer');
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, { threshold: 0.1 });

    elements.forEach(el => observer.observe(el));
  }, 100);

  // Navigation menu functionality
  const navToggle = document.getElementById("navToggle");
  const navLinks = document.getElementById("navLinks");

  if (navToggle && navLinks) {
    // Initialize navigation state based on screen size
    function setNavState() {
      if (window.innerWidth > 767) {
        navLinks.classList.remove("active");
        navToggle.classList.remove("active");
        navToggle.setAttribute("aria-expanded", "false");
      } else {
        navLinks.classList.remove("active");
        navToggle.classList.remove("active");
        navToggle.setAttribute("aria-expanded", "false");
      }
    }

    // Set initial state
    setNavState();

    // Toggle menu when hamburger is clicked
    navToggle.addEventListener("click", () => {
      const isOpen = navLinks.classList.contains("active");
      navLinks.classList.toggle("active", !isOpen);
      navToggle.classList.toggle("active", !isOpen);
      navToggle.setAttribute("aria-expanded", !isOpen);
    });

    // Handle resize events to ensure correct display
    window.addEventListener("resize", setNavState);

    // Close mobile menu when a link is clicked
    const links = navLinks.querySelectorAll("a");
    links.forEach((link) => {
      link.addEventListener("click", () => {
        if (window.innerWidth <= 767) {
          navLinks.classList.remove("active");
          navToggle.classList.remove("active");
          navToggle.setAttribute("aria-expanded", "false");
        }
      });
    });
  } else {
    console.warn("Navigation elements not found.");
  }
});

// 🧠 Check user's numbers for a match
function checkMyNumbers() {
  const inputs = Array.from(document.querySelectorAll(".input-row input")).map(i => parseInt(i.value.trim(), 10));
  const strong = parseInt(document.getElementById("strong").value.trim(), 10);
  const resultDiv = document.getElementById("result");

  if (!resultDiv) {
    console.error("Result div not found");
    return;
  }

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

    const drawNums = ["1", "2", "3", "4", "5", "6"]
      .map(key => draw[key])
      .filter(n => n !== undefined)
      .map(n => parseInt(n, 10))
      .filter(n => !isNaN(n));
      
    if (drawNums.length !== 6) return false;
    
    const drawStrong = parseInt(draw["המספר החזק/נוסף"], 10);
    if (isNaN(drawStrong)) return false;

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

  if (!resultBox) {
    console.error("Luck result box not found");
    return;
  }

  if (!userBirthday || lottoNumbersSince2009.length === 0) {
    resultBox.textContent = "⚠️ יש להזין תאריך תקף.";
    return;
  }

  try {
    const birthdayDate = new Date(userBirthday);
    if (isNaN(birthdayDate.getTime())) {
      resultBox.textContent = "⚠️ תאריך לא תקין.";
      return;
    }
    
    const day = birthdayDate.getDate();
    const month = birthdayDate.getMonth() + 1;

    const dateNumbers = [day, month].filter(n => n <= 37); // Only include numbers that can appear in lotto
    const flatLottoNumbers = lottoNumbersSince2009.flat();
    const totalDrawn = flatLottoNumbers.length;

    if (totalDrawn === 0) {
      resultBox.textContent = "⚠️ אין מספיק נתונים.";
      return;
    }

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
  } catch (err) {
    console.error("Error in displayLuck:", err);
    resultBox.textContent = "⚠️ שגיאה בחישוב הנתונים.";
  }
}

// Statistics loading function
function loadStatistics(data) {
  try {
    const draws = (data.results || []).filter(draw => typeof draw === 'object' && draw["1"]);
    const statsDiv = document.getElementById("statistics");
    
    if (!statsDiv) {
      console.error("Statistics div not found");
      return;
    }

    const numberFreq = new Map();
    const strongFreq = new Map();
    let totalDraws = 0;

    draws.forEach(draw => {
      let validRegularNumbers = 0;
      for (let i = 1; i <= 6; i++) {
        const num = parseInt(draw[i], 10);
        if (!isNaN(num)) {
          numberFreq.set(num, (numberFreq.get(num) || 0) + 1);
          validRegularNumbers++;
        }
      }
      
      // Only count this as a valid draw if we found all 6 regular numbers
      if (validRegularNumbers === 6) {
        const strong = parseInt(draw["המספר החזק/נוסף"], 10);
        if (!isNaN(strong)) strongFreq.set(strong, (strongFreq.get(strong) || 0) + 1);
        totalDraws++;
      }
    });

    if (totalDraws === 0) {
      statsDiv.innerHTML = "⚠️ No valid draws found.";
      return;
    }

    const topNumbers = Array.from(numberFreq.entries())
      .map(([num, count]) => ({ num, count, percent: ((count / (totalDraws * 6)) * 100).toFixed(2) }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const topStrong = Array.from(strongFreq.entries())
      .map(([num, count]) => ({ num, count, percent: ((count / totalDraws) * 100).toFixed(2) }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const table = (title, data, isStrong = false) => `
      <section class="stats-section">
        <h2>${title}</h2>
        <table class="stats-table">
          <thead>
            <tr>
              <th>אחוזים</th>
              <th>כמות הופעות</th>
              <th>${isStrong ? 'מספר חזק' : 'מספר רגיל'}</th>
            </tr>
          </thead>
          <tbody>
            ${data.map(row => `
              <tr>
                <td>${row.percent}%</td>
                <td>${row.count}</td>
                <td>${row.num}</td>
              </tr>`).join("")}
          </tbody>
        </table>
      </section>
    `;

    statsDiv.innerHTML = table("Top 10 Regular Numbers", topNumbers) + table("Top 10 Strong Numbers", topStrong, true);
  } catch (err) {
    console.error("📉 Error loading statistics:", err);
    const statsDiv = document.getElementById("statistics");
    if (statsDiv) {
      statsDiv.innerHTML = "⚠️ Unable to load statistics.";
    }
  }
}