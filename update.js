const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");
const path = require("path");

(async () => {
  const jsonPath = path.join(__dirname, "data", "lotto.json");

  if (!fs.existsSync(jsonPath)) {
    console.error("❌ lotto.json not found.");
    process.exit(1);
  }

  const raw = fs.readFileSync(jsonPath, "utf8");
  const data = JSON.parse(raw);
  const latestLocalDraw = parseInt(data.results[0]["הגרלה"]);

  console.log("🔍 Checking for new draw...");

  const res = await axios.get("https://www.pais.co.il/lotto/archive.aspx");
  const $ = cheerio.load(res.data);
  const firstRow = $("#tblArchive tbody tr").first();
  const tds = firstRow.find("td");

  const drawId = parseInt($(tds[0]).text().trim());
  const drawDate = $(tds[1]).text().trim();
  const numbers = $(tds[2]).find("span").map((_, el) => $(el).text().trim()).get();
  const extra = $(tds[3]).text().trim();

  if (drawId > latestLocalDraw) {
    const newDraw = {
      "1": numbers[0],
      "2": numbers[1],
      "3": numbers[2],
      "4": numbers[3],
      "5": numbers[4],
      "6": numbers[5],
      "הגרלה": drawId.toString(),
      "תאריך": drawDate,
      "המספר החזק/נוסף": extra,
      "מספר_זוכים_לוטו": "0",
      "מספר_זוכים_דאבל_לוטו": "0",
      "": ""
    };

    data.results.unshift(newDraw);
    data.lastUpdated = new Date().toISOString();
    fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2), "utf8");

    console.log(`✅ Added draw ${drawId} (${drawDate}) to lotto.json`);
  } else {
    console.log("ℹ️ lotto.json is already up to date.");
  }
})();
