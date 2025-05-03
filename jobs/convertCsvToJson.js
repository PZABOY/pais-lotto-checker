// ====================
// 📥 CSV → JSON Converter with Date Normalization
// ====================

const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");

const inputPath = path.join(__dirname, "..", "data", "lotto.csv");
const outputPath = path.join(__dirname, "..", "data", "lotto.json");

const output = [];
let headerLogged = false;

// עזר: המרת תאריך מ־DD/MM/YYYY ל־YYYY-MM-DD
function convertToISO(dateStr) {
  const [day, month, year] = dateStr.split("/");
  if (!day || !month || !year) return dateStr;
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

fs.createReadStream(inputPath, { encoding: "utf8" })
  .pipe(csv())
  .on("headers", (headers) => {
    if (!headerLogged) {
      console.log("📌 Headers found:", headers);
      headerLogged = true;
    }
  })
  .on("data", (row) => {
    const values = Object.values(row).map((v) => v.toString().trim());

    if (values.length >= 9 && values.slice(0, 6).every(v => v)) {
      // נניח שהתאריך הוא באינדקס 7 לפי הדוגמה שלך
      const originalDate = values[7];
      const isoDate = convertToISO(originalDate);
      values[7] = isoDate;

      output.push(values);
    }
  })
  .on("end", () => {
    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), "utf8");
    console.log(`✅ Converted ${output.length} rows from lotto.csv to lotto.json`);
  })
  .on("error", (err) => {
    console.error("❌ Error during conversion:", err);
  });
