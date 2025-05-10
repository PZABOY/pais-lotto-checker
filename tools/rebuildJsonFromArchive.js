// ==========================
// 🔁 Full Rebuild from archive.csv → lotto.json
// ==========================
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const csv = require("csv-parser");

const ARCHIVE_URL = "https://www.pais.co.il/download/lotto/archive.csv";
const DOWNLOAD_PATH = path.join(__dirname, "..", "data", "lotto.csv");
const OUTPUT_PATH = path.join(__dirname, "..", "data", "lotto.json");

async function rebuildFromArchive() {
  try {
    const response = await axios.get(ARCHIVE_URL, { responseType: "stream" });

    // Guard: Make sure we're not getting HTML
    let firstChunk = "";
    response.data.on("data", (chunk) => {
      if (!firstChunk) {
        firstChunk = chunk.toString().trim();
        if (firstChunk.startsWith("<!DOCTYPE html")) {
          throw new Error("Received HTML instead of CSV.");
        }
      }
    });

    const results = [];

    response.data
      .pipe(csv())
      .on("data", (row) => {
        if (Object.keys(row).length >= 9) {
          results.push(row);
        }
      })
      .on("end", () => {
        const json = {
          lastUpdated: new Date().toISOString(),
          results,
        };
        fs.writeFileSync(OUTPUT_PATH, JSON.stringify(json, null, 2), "utf8");
        console.log(`✅ Successfully rebuilt lotto.json with ${results.length} draws.`);
      })
      .on("error", (err) => {
        throw err;
      });
  } catch (err) {
    console.error("❌ Failed to rebuild JSON:", err.message);
  }
}

// Run immediately
rebuildFromArchive();
