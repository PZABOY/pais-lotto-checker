const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    defaultViewport: null,
    args: ['--no-sandbox']
  });

  const page = await browser.newPage();
  const downloadPath = path.resolve(__dirname, '../data');

  // ג�… ׳©׳™׳�׳•׳© ׳×׳§׳ ׳™ ׳‘׳₪׳¨׳•׳˜׳•׳§׳•׳� CDP ׳�׳”׳•׳¨׳“׳•׳×
  const client = await page.target().createCDPSession();
  await client.send('Page.setDownloadBehavior', {
    behavior: 'allow',
    downloadPath: downloadPath
  });

  console.log('נ�”„ ׳’׳•׳�׳© ׳�׳¢׳�׳•׳“ ׳”׳�׳¨׳›׳™׳•׳�...');
  await page.goto('https://www.pais.co.il/lotto/archive.aspx', { waitUntil: 'networkidle2' });

  console.log('נ�“¥ ׳�׳ ׳¡׳” ׳�׳�׳—׳•׳¥ ׳¢׳� ׳›׳₪׳×׳•׳¨ ׳”׳”׳•׳¨׳“׳”...');
  await page.evaluate(() => {
    const buttons = document.querySelectorAll('div.content_download_txt');
    const downloadBtn = Array.from(buttons).find(el =>
      el.textContent.includes('׳”׳•׳¨׳“׳× ׳×׳•׳¦׳�׳•׳× ׳”׳”׳’׳¨׳�׳” ׳‘׳₪׳•׳¨׳�׳˜ CSV')
    );
    if (downloadBtn) {
      downloadBtn.click();
    } else {
      console.error('ג�� ׳�׳� ׳ ׳�׳¦׳� ׳›׳₪׳×׳•׳¨ ׳”׳•׳¨׳“׳” ׳‘׳“׳£');
    }
  });

  // ג�³ ׳�׳—׳›׳” ׳�׳¡׳™׳•׳� ׳”׳”׳•׳¨׳“׳” (5 ׳©׳ ׳™׳•׳×)
  await new Promise(resolve => setTimeout(resolve, 5000));

  await browser.close();
  console.log('נ��‰ ׳”׳¡׳×׳™׳™׳�! ׳‘׳“׳•׳§ ׳�׳× ׳”׳×׳™׳§׳™׳™׳” data/');
})();
