const fs = require('fs');
const file = 'c:/Projects/TheBoxSync/admin/src/views/admin/statistics/CustomerInsightsReport.js';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/const \[reportData, setReportData\] = useState\(null\);/, 
`const [reportData, setReportData] = useState(null);
  const [acqPage, setAcqPage] = useState(1);
  const acqPerPage = 10;`);

content = content.replace(/\$\{String\(item._id.day\)\.padStart\(2, '0'\)\}-\$\{String\(item._id.month\)\.padStart\(2, '0'\)\}-\$\{item._id.year\}/g, 
"`${String(item._id.day).padStart(2, '0')}/${String(item._id.month).padStart(2, '0')}/${item._id.year}`");

content = content.replace(/\.slice\(0, 10\)/g, ".slice((acqPage - 1) * acqPerPage, acqPage * acqPerPage)");

let paginationJsx = `
                      {reportData.acquisitionTrend && Math.ceil(reportData.acquisitionTrend.length / acqPerPage) > 1 && (
                        <div className="d-flex justify-content-center mt-4">
                          <Pagination>
                            <Pagination.Prev onClick={() => setAcqPage(p => Math.max(1, p - 1))} disabled={acqPage === 1} />
                            <Pagination.Item active>{acqPage}</Pagination.Item>
                            <Pagination.Next onClick={() => setAcqPage(p => Math.min(Math.ceil(reportData.acquisitionTrend.length / acqPerPage), p + 1))} disabled={acqPage === Math.ceil(reportData.acquisitionTrend.length / acqPerPage)} />
                          </Pagination>
                        </div>
                      )}
                    </Card.Body>
`;
content = content.replace(/                      <\/div>\s*<\/Card\.Body>/, `                      </div>${paginationJsx}`);

if (!content.includes('Pagination')) {
    content = content.replace(/Modal, Toast, ToastContainer } from 'react-bootstrap';/, "Modal, Toast, ToastContainer, Pagination } from 'react-bootstrap';");
}

fs.writeFileSync(file, content, 'utf8');
console.log('CustomerInsightsReport.js updated');
