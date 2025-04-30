
const cron = require('node-cron');
const axios = require('axios');
const fs = require('fs');
const XLSX = require('xlsx');

const ARCHIVE_URL = 'https://www.pais.co.il/download/lotto/archive.xlsx';
const FILE_PATH = './data/archive.xlsx';

async function downloadArchive() {
    try {
        const response = await axios.get(ARCHIVE_URL, { responseType: 'arraybuffer' });
        fs.writeFileSync(FILE_PATH, response.data);
        console.log(`[${new Date().toLocaleString()}] Archive downloaded.`);

        const workbook = XLSX.readFile(FILE_PATH);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(sheet);

        fs.writeFileSync('./data/lotto.json', JSON.stringify(data, null, 2));
        console.log(`Parsed and saved ${data.length} results to data/lotto.json`);
    } catch (err) {
        console.error("❌ Failed to download or process archive:", err.message);
    }
}

// Schedule: every day at 23:59
cron.schedule('59 23 * * *', downloadArchive);
