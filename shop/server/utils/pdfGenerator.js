const puppeteer = require('puppeteer');
const ejs = require('ejs');
const path = require('path');

async function generatePDF(data, templateName) {
    try {
        // 1. Render HTML with data
        const templatePath = path.join(__dirname, `../templates/${templateName}.ejs`);
        const html = await ejs.renderFile(templatePath, data);

        // 2. Launch Puppeteer
        const browser = await puppeteer.launch({ 
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox'] 
        });
        const page = await browser.newPage();
        
        // 3. Set HTML content
        await page.setContent(html, { waitUntil: 'networkidle0' });

        // 4. Generate PDF buffer
        const pdfBuffer = await page.pdf({ 
            format: 'A4',
            printBackground: true,
            margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' }
        });

        await browser.close();
        return pdfBuffer;
    } catch (error) {
        console.error("Error generating PDF:", error);
        throw error;
    }
}

module.exports = {
    generatePDF
};
