const fs = require("fs");
const path = require("path");
const axios = require("axios");
const csv = require("csv-parser");
const cron = require("node-cron");

const ARCHIVE_URL = 'https://www.pais.co.il/download/lotto/archive.csv';
const CSV_PATH = path.join(__dirname, "../Lotto.csv");
const OUTPUT_PATH = path.join(__dirname, "../lotto.json");

async function downloadArchive() {
  try {
    const response = await axios.get(ARCHIVE_URL, { responseType: 'stream' });
    const results = [];
    const converted = [];
    let firstChunk = '';

    const stream = response.data
      .on('data', chunk => {
        if (!firstChunk) {
          firstChunk = chunk.toString().trim();
          if (firstChunk.startsWith('<!DOCTYPE html')) {
            console.error('❌ ERROR: Received HTML instead of CSV.');
            stream.destroy();
            return;
          }
        }
      })
      .pipe(csv())
      .on('data', (row) => {
        results.push(row);
        const flat = Object.values(row).map(v => v.toString().trim());
        if (flat.length >= 9) {
          converted.push(flat);
        }
      })
      .on('end', () => {
        fs.writeFileSync(OUTPUT_PATH, JSON.stringify(converted, null, 2), "utf8");
        console.log(`✅ lotto.json updated with ${converted.length} rows`);
      });

  } catch (err) {
    console.error("❌ Failed to download or process archive:", err.message);
  }
}

// Schedule daily at 23:59
cron.schedule("59 23 * * *", downloadArchive);

// Run once immediately
downloadArchive();
