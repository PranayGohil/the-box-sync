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
router.get("/word-preview", authMiddleware, async (req, res) => {
  try {
    const userId = (req.user && typeof req.user === 'object') ? (req.user.id || req.user._id) : req.user;
    const config = await PayrollConfig.findOne({ user_id: userId });

    const queryFilepath = req.query.filepath;
    const wordPath = queryFilepath
      ? path.join(__dirname, "..", queryFilepath)
      : (config?.document_templates?.joining_letter_word
        ? path.join(__dirname, "..", config.document_templates.joining_letter_word)
        : null);

    // If queryFilepath is not specified, check if there's already browser-edited HTML
    if (!queryFilepath && config?.document_templates?.joining_letter_word_html) {
      return res.json({ success: true, html: config.document_templates.joining_letter_word_html, source: 'edited' });
    }

    // Otherwise convert the .docx to HTML
    if (!wordPath || !fs.existsSync(wordPath)) {
      return res.json({ success: true, html: '', source: 'empty' });
    }

    function transformParagraph(element) {
      if (element.alignment) {
        return { 
          ...element, 
          styleId: `${element.alignment}-aligned`,
          styleName: `${element.alignment}-aligned`
        };
      }
      return element;
    }

    const options = {
      transformDocument: mammoth.transforms.paragraph(transformParagraph),
      styleMap: [
        "p[style-name='center-aligned'] => p.ql-align-center:fresh",
        "p[style-name='right-aligned'] => p.ql-align-right:fresh",
        "p[style-name='left-aligned'] => p.ql-align-left:fresh",
        "p[style-name='both-aligned'] => p.ql-align-justify:fresh",
        "p[style-name='justify-aligned'] => p.ql-align-justify:fresh"
      ]
    };

    const result = await mammoth.convertToHtml({ path: wordPath }, options);
    return res.json({ success: true, html: result.value, source: 'docx' });
  } catch (err) {
    console.error('Error converting word to html:', err);
    return res.status(500).json({ success: false, message: 'Failed to load Word template for editing.' });
  }
});

module.exports = router;
