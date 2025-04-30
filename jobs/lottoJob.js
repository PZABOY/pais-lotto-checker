const cron = require('node-cron');
const axios = require('axios');
const fs = require('fs');
const csv = require('csv-parser');

const ARCHIVE_URL = 'https://www.pais.co.il/download/lotto/archive.csv';
const FILE_PATH = './data/archive.csv';

async function downloadArchive() {
    try {
        const response = await axios.get(ARCHIVE_URL, { responseType: 'stream' });
        const results = [];
        let firstChunk = '';

        const checkStream = response.data
            .on('data', chunk => {
                if (!firstChunk) {
                    firstChunk = chunk.toString().trim();
                    if (firstChunk.startsWith('<!DOCTYPE html')) {
                        console.error('❌ ERROR: Received HTML page instead of CSV file.');
                        checkStream.destroy(); // Stop reading
                        return;
                    }
                }
            })
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', () => {
                fs.writeFileSync('./data/lotto.json', JSON.stringify(results, null, 2));
                console.log(`✅ Parsed and saved ${results.length} results to data/lotto.json`);
            });

    } catch (err) {
        console.error("❌ Failed to download or process archive:", err.message);
    }
}

// Schedule: every day at 23:59
cron.schedule('59 23 * * *', downloadArchive);

// Run immediately once
downloadArchive();
