
# Pais Lotto Checker

Node.js script that downloads the Israeli Lotto archive from Mifal HaPais once per day (at 23:59), parses the Excel data, and stores it as JSON for later validation of user numbers.

## Setup

```bash
npm install
npm start
```

The job runs daily and saves data to `data/lotto.json`.
