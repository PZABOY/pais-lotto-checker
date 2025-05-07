const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");
const iconv = require("iconv-lite");
const { Readable } = require("stream");

// הגדרות קבצים
const downloadPath = path.resolve(__dirname, "data");
const csvFilePath = path.join(downloadPath, "Lotto.csv");
const jsonFilePath = path.join(downloadPath, "lotto.json");

// פונקציה שממתינה להורדת הקובץ בפועל
function waitForFile(filePath, timeout = 15000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const check = () => {
      if (fs.existsSync(filePath)) return resolve();
      if (Date.now() - start > timeout) return reject("❌ Timeout waiting for file");
      setTimeout(check, 500);
    };
    check();
  });
}

(async () => {
  // מחיקת קובץ CSV קודם (אם קיים)
  if (fs.existsSync(csvFilePath)) {
    fs.unlinkSync(csvFilePath);
    console.log("🧹 Old Lotto.csv removed.");
  }

  const browser = await puppeteer.launch({
    headless: "new",
    defaultViewport: null,
    args: ["--no-sandbox"],
  });

  const page = await browser.newPage();

  const client = await page.target().createCDPSession();
  await client.send("Page.setDownloadBehavior", {
    behavior: "allow",
    downloadPath: downloadPath,
  });

  console.log("🔁 Navigating to site...");
  await page.goto("https://www.pais.co.il/lotto/archive.aspx", {
    waitUntil: "networkidle2",
  });

  console.log("⬇️ Clicking download button...");
  const downloadSuccess = await page.evaluate(() => {
    const buttons = document.querySelectorAll("div.content_download_txt");
    const downloadBtn = Array.from(buttons).find((el) =>
      el.textContent.includes("הורדת תוצאות ההגרלה בפורמט CSV")
    );
    if (downloadBtn) {
      downloadBtn.click();
      return true;
    }
    return false;
  });

  if (!downloadSuccess) {
    console.error("❌ Download button not found.");
    await browser.close();
    process.exit(1);
  }

  console.log("⏳ Waiting for CSV download...");
  try {
    await waitForFile(csvFilePath, 15000);
    console.log("✅ CSV download complete!");
  } catch (err) {
    console.error(err);
    await browser.close();
    process.exit(1);
  }

  await browser.close();

  // קריאת CSV והמרה ל־JSON
  try {
    const rawBuffer = fs.readFileSync(csvFilePath);
    const decodedText = iconv.decode(rawBuffer, "win1255");
    const results = [];

    Readable.from(decodedText)
      .pipe(csv())
      .on("data", (data) => results.push(data))
      .on("end", () => {
        const jsonData = {
          lastUpdated: new Date().toISOString(),
          hebrewDate: new Date().toLocaleDateString("he-IL"),
          results,
        };
        fs.writeFileSync(jsonFilePath, JSON.stringify(jsonData, null, 2), "utf8");
        console.log(`📁 JSON saved successfully with ${results.length} entries.`);
      })
      .on("error", (err) => {
        console.error("❌ Error parsing CSV:", err.message);
        process.exit(1);
      });
  } catch (err) {
    console.error("❌ Failed to process Lotto.csv:", err.message);
    process.exit(1);
  }
})();
