const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/auth-middlewares");
const { getConfig, updateConfig } = require("../controllers/payrollConfigController");
const mammoth = require("mammoth");
const path = require("path");
const fs = require("fs");
const PayrollConfig = require("../models/PayrollConfig");

router.route("/").get(authMiddleware, getConfig);
router.route("/").put(authMiddleware, updateConfig);

// Convert uploaded .docx → HTML so the user can edit it in the browser
const JSZip = require("jszip");

async function convertDocxToHtmlWithPageBreaks(wordPath, mammothOptions) {
  const fileBuffer = fs.readFileSync(wordPath);
  const zip = await JSZip.loadAsync(fileBuffer);
  const docXmlFile = zip.file("word/document.xml");
  if (!docXmlFile) {
    const result = await mammoth.convertToHtml({ path: wordPath }, mammothOptions);
    return result.value;
  }

  let docXml = await docXmlFile.async("string");

  // 1. Convert manual page breaks: <w:br w:type="page"/> -> :::PAGE_BREAK::: text run
  docXml = docXml.replace(/<w:br\s+[^>]*w:type=["']page["'][^>]*\/>/g, '<w:t>:::PAGE_BREAK:::</w:t>');

  // 2. Convert next-page section breaks: <w:pPr> ... <w:sectPr> (without continuous) ... </w:sectPr> </w:pPr> </w:p> -> append a page break paragraph
  const pRegex = /<w:p(?:\s[^>]*)?>[\s\S]*?<w:pPr>[\s\S]*?<w:sectPr([\s\S]*?)<\/w:sectPr>[\s\S]*?<\/w:pPr>[\s\S]*?<\/w:p>/gi;
  docXml = docXml.replace(pRegex, (fullMatch, sectPrBody) => {
    if (sectPrBody.includes('w:val="continuous"')) {
      return fullMatch;
    }
    const pageBreakParagraph = '<w:p><w:pPr><w:pStyle w:val="Normal"/></w:pPr><w:r><w:t>:::PAGE_BREAK:::</w:t></w:r></w:p>';
    return fullMatch + pageBreakParagraph;
  });

  zip.file("word/document.xml", docXml);
  const updatedBuffer = await zip.generateAsync({ type: "nodebuffer" });
  
  const result = await mammoth.convertToHtml({ buffer: updatedBuffer }, mammothOptions);
  let html = result.value;

  // Post-process HTML to turn markers into clean page breaks
  html = html.replace(/<p>[^<]*:::PAGE_BREAK:::[^<]*<\/p>/g, '<div class="page-break" contenteditable="false">&nbsp;</div>');
  html = html.replace(/:::PAGE_BREAK:::/g, '<div class="page-break" contenteditable="false">&nbsp;</div>');

  return html;
}

// Convert uploaded .docx → HTML so the user can edit it in the browser
router.get("/word-preview", authMiddleware, async (req, res) => {
  try {
    const userId = (req.user && typeof req.user === 'object') ? (req.user.id || req.user._id) : req.user;
    const config = await PayrollConfig.findOne({ user_id: userId });

    const queryFilepath = req.query.filepath;
    const forceRefresh = req.query.refresh === '1';

    const wordPath = queryFilepath
      ? path.join(__dirname, "..", queryFilepath)
      : (config?.document_templates?.joining_letter_word
        ? path.join(__dirname, "..", config.document_templates.joining_letter_word)
        : null);

    // If .docx file exists → always convert fresh (latest Mammoth options)
    // Only fall back to saved browser-edited HTML if no docx is present
    const docxExists = wordPath && fs.existsSync(wordPath);

    if (!docxExists) {
      // No source docx: return saved HTML if we have it, else empty
      if (!queryFilepath && config?.document_templates?.joining_letter_word_html) {
        return res.json({ success: true, html: config.document_templates.joining_letter_word_html, source: 'edited' });
      }
      return res.json({ success: true, html: '', source: 'empty' });
    }

    function transformParagraph(element) {
      let result = { ...element };
      // Map Word alignment values to inline CSS alignment
      if (element.alignment) {
        const alignMap = {
          center: 'center',
          right: 'right',
          left: 'left',
          both: 'justify',
          justify: 'justify'
        };
        const cssAlign = alignMap[element.alignment];
        if (cssAlign) {
          // Store so styleMap can pick it up
          result.styleId = `${element.alignment}-aligned`;
          result.styleName = `${element.alignment}-aligned`;
        }
      }
      return result;
    }

    const options = {
      transformDocument: mammoth.transforms.paragraph(transformParagraph),
      styleMap: [
        // Alignment classes
        "p[style-name='center-aligned'] => p.ql-align-center:fresh",
        "p[style-name='right-aligned'] => p.ql-align-right:fresh",
        "p[style-name='left-aligned'] => p.ql-align-left:fresh",
        "p[style-name='both-aligned'] => p.ql-align-justify:fresh",
        "p[style-name='justify-aligned'] => p.ql-align-justify:fresh",
        // Heading styles → plain paragraphs with bold (no colored <h> tags)
        "p[style-name='Heading 1'] => p.doc-h1:fresh",
        "p[style-name='Heading 2'] => p.doc-h2:fresh",
        "p[style-name='Heading 3'] => p.doc-h3:fresh",
        // Preserve underlines
        "u => u"
      ]
    };

    const html = await convertDocxToHtmlWithPageBreaks(wordPath, options);
    return res.json({ success: true, html, source: 'docx' });
  } catch (err) {
    console.error('Error converting word to html:', err);
    return res.status(500).json({ success: false, message: 'Failed to load Word template for editing.' });
  }
});

module.exports = router;
