const fs = require('fs');
const path = require('path');

const dir = 'c:/Projects/TheBoxSync/admin/src/views/admin/statistics';
const files = ['CustomerInsightsReport.js', 'FinancialReport.js', 'InventoryReport.js', 'MenuPerformanceReport.js', 'OperationalReport.js', 'SalesReport.js'];

files.forEach(file => {
    let filePath = path.join(dir, file);
    if (!fs.existsSync(filePath)) return;
    let content = fs.readFileSync(filePath, 'utf8');

    // 1. Change useEffect(() => { fetch*(); }, []); to depend on [startDate, endDate]
    content = content.replace(/useEffect\(\(\) => \{\s*(fetch[A-Za-z]+Report)\(\);\s*\}, \[\]\);/g, "useEffect(() => {\n    1();\n  }, [startDate, endDate]);");
    
    // 2. Remove Generate Button Col entirely
    content = content.replace(/<Col xs=\{12\} md=\{5\}>([\s\S]*?)<\/Col>\s*<Col xs=\{12\} md=\{5\}>([\s\S]*?)<\/Col>\s*<Col xs=\{12\} md=\{2\} className="d-flex align-items-end">[\s\S]*?<\/Col>/g, 
        '<Col xs={12} md={6}>1</Col>\n                <Col xs={12} md={6}>2</Col>');

    // 3. Format replacements
    content = content.replace(/'dd-MM-yyyy'/g, "'dd/MM/yyyy'");
    content = content.replace(/'dd MMM yyyy'/g, "'dd/MM/yyyy'");
    content = content.replace(/'MMM dd'/g, "'dd/MM/yyyy'");
    content = content.replace(/'dd MMM yyyy hh:mm a'/g, "'dd/MM/yyyy hh:mm a'");
    content = content.replace(/'dd-MM-yyyy hh:mm a'/g, "'dd/MM/yyyy hh:mm a'");

    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Processed ' + file);
});
