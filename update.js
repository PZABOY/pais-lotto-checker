const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");
const iconv = require("iconv-lite"); // הוספה
const { Readable } = require("stream");

(async () => {
  const browser = await puppeteer.launch({
    headless: "new",
    defaultViewport: null,
    args: ["--no-sandbox"],
  });

  const page = await browser.newPage();
  const downloadPath = path.resolve(__dirname, "data");

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
  await page.evaluate(() => {
    const buttons = document.querySelectorAll("div.content_download_txt");
    const downloadBtn = Array.from(buttons).find((el) =>
      el.textContent.includes("הורדת תוצאות ההגרלה בפורמט CSV")
    );
    if (downloadBtn) downloadBtn.click();
    else console.error("❌ Download button not found.");
  });

  await new Promise((resolve) => setTimeout(resolve, 5000));
  await browser.close();
  console.log("✅ Download complete!");

  const csvFilePath = path.join(downloadPath, "Lotto.csv");
  const jsonFilePath = path.join(downloadPath, "lotto.json");

  if (!fs.existsSync(csvFilePath)) {
    console.error("❌ CSV file not found.");
    process.exit(1);
  }

  const rawBuffer = fs.readFileSync(csvFilePath);
  const decodedText = iconv.decode(rawBuffer, "win1255");
  const results = [];

  Readable.from(decodedText)
    .pipe(csv())
    .on("data", (data) => results.push(data))
    .on("end", () => {
      const jsonData = {
        lastUpdated: new Date().toISOString(),
        results,
      };
      fs.writeFileSync(jsonFilePath, JSON.stringify(jsonData, null, 2));
      console.log(`📁 JSON saved successfully from: Lotto.csv`);
    });
})();
