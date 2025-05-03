// ====================
// 🎯 Pais Lotto Checker – Full Auto Update & Frontend Logic
// ====================

let rawLottoData = [];
let lottoNumbersSince2009 = [];

// 🔁 Server-side auto update (only runs in Node.js)
if (typeof window === "undefined") {
  const fs = require("fs"); // Import fs module for file system operations
  const path = require("path"); // Import path module for file paths
  const csv = require("csv-parser"); // Import csv-parser to parse CSV files
  const axios = require("axios"); // Import axios for making HTTP requests
  const cron = require("node-cron"); // Import node-cron for scheduling tasks

  const csvUrl = "https://www.pais.co.il/download/lotto/archive.csv"; // URL for downloading lotto archive
  const csvPath = path.join(__dirname, "data", "lotto.csv"); // Path to save the CSV file
  const jsonPath = path.join(__dirname, "data", "lotto.json"); // Path to save the JSON file

  async function updateData() {
    try {
      // Fetch the CSV file and save it to the specified path
      const response = await axios.get(csvUrl, { responseType: "stream" });
      const writer = fs.createWriteStream(csvPath);
      response.data.pipe(writer);

      writer.on("finish", () => {
        const output = []; // Initialize output array
        // Read the CSV file and parse it
        fs.createReadStream(csvPath, { encoding: "utf8" })
          .pipe(csv())
          .on("headers", (headers) => {
            console.log("📌 Headers found:", headers); // Log headers for debugging
          })
          .on("data", (row) => {
            const rowArray = Object.values(row).map((v) => v.toString().trim()); // Convert row values to an array
            if (rowArray.length >= 9) output.push(rowArray); // Only push valid rows
          })
          .on("end", () => {
            // Save the parsed data as JSON
            fs.writeFileSync(jsonPath, JSON.stringify(output, null, 2), "utf8");
            console.log(`✅ Converted ${output.length} rows from lotto.csv to lotto.json`);
          });
      });
    } catch (err) {
      // If any error occurs, log it
      console.error("❌ Failed to update lotto data:", err);
    }
  }

  cron.schedule("59 23 * * *", updateData); // Run the update function at 23:59 every day
  updateData(); // Run the update function immediately on startup
}

// 🌐 Client-side fetch & processing
fetch("data/lotto.json")
  .then((r) => r.json()) // Parse the JSON data
  .then((data) => {
    // Filter the lotto data and ensure it's valid
    rawLottoData = (data.results || []).filter(draw => typeof draw === 'object' && draw["1"]);
    console.log("✅ Loaded:", rawLottoData.length, "draws");

    // Process lotto numbers from 2009 onward
    lottoNumbersSince2009 = rawLottoData
      .filter((draw) => {
        const dateStr = draw["תאריך"]; // Assuming 'תאריך' is the date field
        const year = new Date(dateStr).getFullYear(); // Extract year from date
        return year >= 2009; // Filter only draws from 2009 and onward
      })
      .map((draw) => [draw["1"], draw["2"], draw["3"], draw["4"], draw["5"], draw["6"]].map((n) => parseInt(n, 10))); // Extract numbers from each draw

    console.log("📆 From 2009:", lottoNumbersSince2009.length, "draws");
  })
  .catch((err) => {
    // If there's an error loading the JSON data, log it
    console.error("❌ Failed to load lotto data:", err);
  });

// 🧠 Check user's numbers for a match
function checkMyNumbers() {
  const inputs = Array.from(document.querySelectorAll(".input-row input")).map(i => parseInt(i.value.trim(), 10)); // Get user input numbers
  const strong = parseInt(document.getElementById("strong").value.trim(), 10); // Get user's strong number
  const resultDiv = document.getElementById("result"); // Div to display result

  // Validate user input
  if (
    inputs.length !== 6 ||
    inputs.some(n => n < 1 || n > 37 || isNaN(n)) ||
    strong < 1 || strong > 7 || isNaN(strong)
  ) {
    resultDiv.textContent = "⚠️ אנא הכנס 6 מספרים תקפים (1–37) ומספר חזק (1–7)"; // Display error in Hebrew
    resultDiv.classList.remove("match");
    return;
  }

  // Find matching draw
  const match = rawLottoData.find(draw => {
    if (!draw || typeof draw !== 'object') return false; // Ensure valid data format

    const drawNums = [draw["1"], draw["2"], draw["3"], draw["4"], draw["5"], draw["6"]].map(n => parseInt(n, 10)); // Get the draw numbers
    const drawStrong = parseInt(draw["המספר החזק/נוסף"], 10); // Get the strong number

    const allExist = inputs.every(n => drawNums.includes(n)); // Check if all user numbers are in the draw
    return allExist && drawStrong === strong; // Match if both conditions are true
  });

  // Display result based on match
  if (match) {
    resultDiv.textContent = `איזה באסה המספרים שלך כבר זכו! הגרלה מספר ${match["הגרלה"]} בתאריך ${match["תאריך"]}`; // Match found, display message in Hebrew
    resultDiv.classList.add("match");
  } else {
    resultDiv.textContent = "וואלה הם מעולם לא נתנו במזל, אולי בפעם הבאה?"; // No match, display message in Hebrew
    resultDiv.classList.remove("match");
  }
}

// 🎂 Display luck based on user's birthdate
function displayLuck() {
  const userBirthday = document.getElementById("birthdayInput").value; // Get user's birthday input
  const resultBox = document.getElementById("luckResult"); // Div to display luck result

  if (!userBirthday || lottoNumbersSince2009.length === 0) {
    resultBox.textContent = "⚠️ יש להזין תאריך תקף."; // Display error if birthday or data is missing
    return;
  }

  const birthdayDate = new Date(userBirthday); // Parse the date
  const day = birthdayDate.getDate(); // Get the day of the month
  const month = birthdayDate.getMonth() + 1; // Get the month (1-based)

  const dateNumbers = [day, month]; // Combine day and month for matching
  const flatLottoNumbers = lottoNumbersSince2009.flat(); // Flatten all lotto numbers into a single array
  const totalDrawn = flatLottoNumbers.length; // Total number of drawn numbers

  // Count occurrences of the user's birthday numbers
  const breakdown = dateNumbers.map((num) => {
    const count = flatLottoNumbers.filter((n) => n === num).length;
    const percentage = ((count / totalDrawn) * 100).toFixed(2);
    return { num, count, percentage };
  });

  // Display the luck statistics
  const resultHTML = breakdown
    .map(
      (entry) =>
        `המספר <b>${entry.num}</b> הופיע <b>${entry.count}</b> פעמים (<b>${entry.percentage}%</b>)`
    )
    .join("<br>");

  resultBox.innerHTML = ` <br>${resultHTML}<br><small>* מבוסס על הגרלות מ־2009</small>`; // Add small note in Hebrew
}

// 🧪 Submit button functionality
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("lotto-form");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      checkMyNumbers(); // Call checkMyNumbers when form is submitted
    });
  }
});
