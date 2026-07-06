import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useHistory } from 'react-router-dom';
import { Button, Spinner, Dropdown } from 'react-bootstrap';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import { toast } from 'react-toastify';
import { getPayrollConfig, updatePayrollConfig, getWordTemplateHtml } from 'api/payrollConfig';

const getPlaceholdersList = (config) => {
    if (!config) return [];
    const base = [
        '[First Name]', '[Last Name]', '[Full Name]',
        '[Job Title]', '[Date of Joining]', '[Basic Salary]',
        '[Staff ID]', '[Email]', '[Phone]', '[Department]', '[Company Name]',
        '[Birth Date]', '[Address]', '[Country]', '[State]', '[City]', '[Gender]', '[Pincode]',
        '[PAN Number]', '[UAN Number]', '[ESI IP Number]', '[Bank Name]', '[Account Number]',
        '[IFSC Code]', '[Bank Branch]', '[Document Type]', '[ID Number]',
        '[Gross Salary]', '[HRA]', '[Conveyance]', '[Medical Allowance]', '[Special Allowance]', '[Other Allowance]'
    ];
    const extra = [];
    if (config.custom_earnings) {
        config.custom_earnings.forEach(e => { if (e.is_active && e.label) extra.push(`[${e.label.trim()}]`); });
    }
    if (config.statutory_config?.pf?.is_mandatory) extra.push('[EPF Deduction]');
    if (config.statutory_config?.esi?.is_mandatory) extra.push('[ESI Deduction]');
    if (config.statutory_config?.pt?.is_applicable) extra.push('[PT Deduction]');
    if (config.custom_deductions) {
        config.custom_deductions.forEach(d => { if (d.is_active && d.label) extra.push(`[${d.label.trim()}]`); });
    }
    return Array.from(new Set([...base, ...extra]));
};

const stripPlaceholders = (html) => {
    if (!html) return '';
    return html.replace(/<span[^>]*class=["']editor-placeholder["'][^>]*>(.*?)<\/span>/gi, '$1');
};

const wrapPlaceholders = (html, placeholdersList) => {
    if (!html) return '';
    const clean = stripPlaceholders(html);
    let out = clean;
    placeholdersList.forEach(ph => {
        const esc = ph.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
        out = out.replace(new RegExp(esc, 'g'), `<span class="editor-placeholder" contenteditable="false">${ph}</span>`);
    });
    return out;
};

const getIframeStyles = () => `
    * { box-sizing: border-box; }
    html {
        background: #b0b8c4;
        margin: 0; padding: 0;
        min-height: 100%;
    }
    body {
        font-family: "Times New Roman", Times, Georgia, serif;
        font-size: 12pt;
        line-height: 1.15;
        color: #000000;
        background: #ffffff;
        width: 210mm;
        min-height: 297mm;
        margin: 24px auto 48px auto;
        padding: 25.4mm 25.4mm 25.4mm 25.4mm;
        outline: none;
        box-shadow: 0 4px 20px rgba(0,0,0,0.25), 0 1px 4px rgba(0,0,0,0.1);
        border: 1px solid #b0b8c4;
        word-wrap: break-word;
    }
    p {
        margin-top: 0;
        margin-bottom: 8pt;
        text-align: left;
    }
    h1, h2, h3, h4, h5, h6 {
        font-family: "Times New Roman", Times, Georgia, serif;
        color: #000000;
        font-weight: bold;
        margin-top: 12pt;
        margin-bottom: 6pt;
        line-height: 1.2;
    }
    h1 { font-size: 14pt; }
    h2 { font-size: 13pt; }
    h3 { font-size: 12pt; }
    table { width: 100%; border-collapse: collapse; margin: 8pt 0 12pt; }
    th, td { border: 1px solid #000000; padding: 4pt 6pt; font-size: 11pt; text-align: left; }
    th { background: #f2f2f2; font-weight: bold; }
    img { max-width: 100%; height: auto; display: block; }
    ul, ol { margin-top: 0; margin-bottom: 8pt; padding-left: 18pt; }
    li { margin-top: 0; margin-bottom: 0; }
    /* Alignment classes from Mammoth conversion */
    .ql-align-center, .center-aligned { text-align: center !important; }
    .ql-align-right,  .right-aligned  { text-align: right  !important; }
    .ql-align-justify,.both-aligned,.justify-aligned { text-align: justify !important; }
    .ql-align-left,   .left-aligned   { text-align: left   !important; }
    /* Underline inside spans/u tags */
    u, [style*="text-decoration: underline"], [style*="text-decoration:underline"] { text-decoration: underline; }
    /* Word Heading styles without browser heading colors — plain bold black */
    .doc-h1 { font-size: 14pt; font-weight: bold; color: #000 !important; margin: 12pt 0 6pt; }
    .doc-h2 { font-size: 13pt; font-weight: bold; color: #000 !important; margin: 10pt 0 4pt; }
    .doc-h3 { font-size: 12pt; font-weight: bold; color: #000 !important; margin: 8pt 0 4pt; }
    /* Placeholder: pure inline, inherits everything, no layout disruption */
    .editor-placeholder {
        display: inline;
        font-family: inherit !important;
        font-size: inherit !important;
        font-weight: inherit !important;
        font-style: inherit !important;
        line-height: inherit !important;
        color: #1e40af !important;
        background-color: #dbeafe !important;
        border-bottom: 1.5px dashed #3b82f6 !important;
        padding: 0 1px !important;
        margin: 0 !important;
        cursor: default !important;
        user-select: none;
        vertical-align: baseline;
    }
    .page-break {
        display: block !important;
        height: 0 !important;
        overflow: visible !important;
        border: none !important;
        background: transparent !important;
        position: relative !important;
        margin: 22pt 0 !important;
        page-break-after: always !important;
        user-select: none !important;
        cursor: default !important;
    }
    .page-break::before {
        content: "" !important;
        display: block !important;
        position: absolute !important;
        left: -25.4mm !important;
        right: -25.4mm !important;
        top: -11px !important;
        height: 0 !important;
        border-top: 2px dashed #9ca3af !important;
    }
    .page-break::after {
        content: "Page Break" !important;
        display: inline-block !important;
        position: absolute !important;
        left: 50% !important;
        top: -18px !important;
        transform: translateX(-50%) !important;
        background: #e5e7eb !important;
        color: #6b7280 !important;
        font-size: 8pt !important;
        font-family: "Segoe UI", sans-serif !important;
        font-weight: 700 !important;
        letter-spacing: 1px !important;
        padding: 0 8px !important;
        border-radius: 3px !important;
        pointer-events: none !important;
        white-space: nowrap !important;
    }
    *:focus { outline: none; }
    ::selection { background: #b3d4ff; }
`;

const ToolBtn = ({ onClick, title, children, danger }) => (
    <button
        type="button"
        title={title}
        onClick={onClick}
        style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            height: 28, minWidth: 28, padding: '0 6px',
            border: '1px solid #dee2e6', borderRadius: 3,
            background: '#fff', color: danger ? '#dc3545' : '#212529',
            fontSize: 12, cursor: 'pointer',
            transition: 'background 0.1s', whiteSpace: 'nowrap', flexShrink: 0,
        }}
        onMouseEnter={e => { e.currentTarget.style.background = '#f1f3f4'; }}
        onMouseLeave={e => { e.currentTarget.style.background = '#fff'; }}
    >
        {children}
    </button>
);

const Sep = () => (
    <div style={{ width: 1, height: 22, background: '#dee2e6', margin: '0 3px', flexShrink: 0 }} />
);

const EditWordTemplate = () => {
    const history = useHistory();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [config, setConfig] = useState(null);
    const [wordEditorHtml, setWordEditorHtml] = useState('');
    const [isSourceView, setIsSourceView] = useState(false);
    const iframeRef = useRef(null);
    const loadedHtmlRef = useRef(null);

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const res = await getPayrollConfig();
                if (res.success && res.data) {
                    setConfig(res.data);
                    const filepath = res.data.document_templates?.joining_letter_word || '';
                    const htmlRes = await getWordTemplateHtml(filepath);
                    if (htmlRes.success) {
                        const list = getPlaceholdersList(res.data);
                        const wrapped = wrapPlaceholders(htmlRes.html || '', list);
                        setWordEditorHtml(wrapped);
                    } else {
                        toast.error('Failed to load Word template HTML.');
                    }
                } else {
                    toast.error('Failed to fetch payroll configuration.');
                }
            } catch (err) {
                console.error('Error fetching payroll config:', err);
                toast.error('Failed to load payroll configuration.');
            } finally {
                setLoading(false);
            }
        };
        fetchConfig();
    }, []);

    const availablePlaceholders = useMemo(() => getPlaceholdersList(config), [config]);

    useEffect(() => {
        let timer;
        const shouldLoad = !loading && !isSourceView && wordEditorHtml && loadedHtmlRef.current !== wordEditorHtml;
        if (shouldLoad) {
            timer = setTimeout(() => {
                const iframe = iframeRef.current;
                if (!iframe) return;
                try {
                    const doc = iframe.contentDocument || iframe.contentWindow.document;
                    doc.open();
                    doc.write(`<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><style>${getIframeStyles()}</style></head><body contenteditable="true" spellcheck="true">${wordEditorHtml}</body></html>`);
                    doc.close();
                    loadedHtmlRef.current = wordEditorHtml;
                } catch (err) {
                    console.error('Error writing to iframe:', err);
                }
            }, 80);
        }
        return () => { if (timer) clearTimeout(timer); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [wordEditorHtml, isSourceView, loading]);

    const cmd = (command, value = null) => {
        const iframe = iframeRef.current;
        if (!iframe) return;
        iframe.contentWindow.focus();
        iframe.contentDocument.execCommand(command, false, value);
    };

    const insertHtml = (html) => {
        const iframe = iframeRef.current;
        if (!iframe) return;
        const win = iframe.contentWindow;
        const doc = iframe.contentDocument;
        win.focus();
        if (win.getSelection) {
            const sel = win.getSelection();
            if (sel.getRangeAt && sel.rangeCount) {
                const range = sel.getRangeAt(0);
                range.deleteContents();
                const div = doc.createElement('div');
                div.innerHTML = html;
                const frag = doc.createDocumentFragment();
                let last;
                while (div.firstChild) last = frag.appendChild(div.firstChild);
                range.insertNode(frag);
                if (last) {
                    const r = range.cloneRange();
                    r.setStartAfter(last);
                    r.collapse(true);
                    sel.removeAllRanges();
                    sel.addRange(r);
                }
            }
        }
    };

    const insertPageBreak = () => {
        insertHtml(`<div class="page-break" contenteditable="false">&nbsp;</div><p><br></p>`);
    };

    const insertTable = () => {
        const rows = parseInt(prompt('Number of rows:', '3'), 10) || 3;
        const cols = parseInt(prompt('Number of columns:', '3'), 10) || 3;
        let html = `<table>`;
        for (let i = 0; i < rows; i++) {
            html += '<tr>';
            for (let j = 0; j < cols; j++) {
                html += i === 0 ? `<th>Header ${j + 1}</th>` : `<td>&nbsp;</td>`;
            }
            html += '</tr>';
        }
        html += `</table><p><br></p>`;
        insertHtml(html);
    };

    const changeFont = () => {
        const font = prompt('Font name (e.g. Arial, Times New Roman, Calibri):', 'Calibri');
        if (font) cmd('fontName', font);
    };

    const changeFontSize = () => {
        const size = prompt('Font size (1-7, where 3=normal):', '3');
        if (size) cmd('fontSize', size);
    };

    const changeTextColor = () => {
        const color = prompt('Text color (name or hex):', '#000000');
        if (color) cmd('foreColor', color);
    };

    const changeHighlight = () => {
        const color = prompt('Highlight color (name or hex):', '#fef08a');
        if (color) cmd('hiliteColor', color);
    };

    const handleSourceToggle = (on) => {
        if (on && iframeRef.current) {
            try {
                const doc = iframeRef.current.contentDocument;
                if (doc && doc.body) setWordEditorHtml(doc.body.innerHTML);
            } catch (e) { console.error(e); }
        }
        if (!on) {
            loadedHtmlRef.current = null;
        }
        setIsSourceView(on);
    };

    const handleSave = async () => {
        setSaving(true);
        let finalHtml = wordEditorHtml;
        if (!isSourceView && iframeRef.current) {
            try {
                const doc = iframeRef.current.contentDocument;
                if (doc && doc.body) finalHtml = doc.body.innerHTML;
            } catch (e) { console.error(e); }
        }
        const cleanedHtml = stripPlaceholders(finalHtml);
        try {
            const res = await updatePayrollConfig({ document_templates: { joining_letter_word_html: cleanedHtml } });
            if (res.success) {
                toast.success('Letter template saved successfully!');
                history.goBack();
            } else {
                toast.error('Failed to save template.');
            }
        } catch (e) {
            toast.error('Failed to save template.');
        } finally {
            setSaving(false);
        }
    };

    // Lock background scroll while editor is open
    useEffect(() => {
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = prev; };
    }, []);

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            display: 'flex', flexDirection: 'column',
            background: '#b0b8c4', zIndex: 1200,
            fontFamily: '"Segoe UI", system-ui, sans-serif',
        }}>
            {/* Title Bar */}
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '7px 16px', background: '#1d4ed8', color: '#fff', flexShrink: 0,
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <button
                        type="button"
                        onClick={() => history.goBack()}
                        style={{
                            background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.35)',
                            color: '#fff', borderRadius: 4, padding: '4px 11px',
                            cursor: 'pointer', fontSize: 13, fontWeight: 600,
                            display: 'inline-flex', alignItems: 'center', gap: 5,
                        }}
                    >
                        <CsLineIcons icon="arrow-left" size={13} />
                        Back
                    </button>
                    <span style={{ fontWeight: 700, fontSize: 14, opacity: 0.95 }}>
                        Edit Joining Letter Template
                    </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 5, cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#bfdbfe', userSelect: 'none' }}>
                        <input type="checkbox" checked={isSourceView} onChange={e => handleSourceToggle(e.target.checked)} style={{ accentColor: '#fff', cursor: 'pointer' }} />
                        HTML Source
                    </label>
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={saving}
                        style={{
                            background: saving ? '#6b7280' : '#16a34a', border: 'none',
                            color: '#fff', borderRadius: 5, padding: '6px 16px',
                            cursor: saving ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 700,
                            display: 'inline-flex', alignItems: 'center', gap: 5,
                            boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
                        }}
                    >
                        {saving
                            ? <><Spinner animation="border" size="sm" style={{ width: 14, height: 14, borderWidth: 2 }} /> Saving…</>
                            : <><CsLineIcons icon="check" size={13} /> Save Changes</>
                        }
                    </button>
                </div>
            </div>

            {/* Ribbon Toolbar */}
            {!isSourceView && !loading && (
                <div style={{ background: '#fff', borderBottom: '1px solid #d1d5db', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', flexShrink: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 2, padding: '5px 10px', overflowX: 'auto' }}>
                        <ToolBtn onClick={() => cmd('undo')} title="Undo"><span style={{ fontSize: 15, fontWeight: 'bold', lineHeight: 1 }}>↺</span></ToolBtn>
                        <ToolBtn onClick={() => cmd('redo')} title="Redo"><span style={{ fontSize: 15, fontWeight: 'bold', lineHeight: 1 }}>↻</span></ToolBtn>
                        <Sep />
                        <ToolBtn onClick={changeFont} title="Font Family"><span style={{ fontSize: 11 }}>Font</span></ToolBtn>
                        <ToolBtn onClick={changeFontSize} title="Font Size"><span style={{ fontSize: 11 }}>Size</span></ToolBtn>
                        <Sep />
                        <ToolBtn onClick={() => cmd('bold')} title="Bold (Ctrl+B)"><strong style={{ fontSize: 13 }}>B</strong></ToolBtn>
                        <ToolBtn onClick={() => cmd('italic')} title="Italic (Ctrl+I)"><em style={{ fontSize: 13 }}>I</em></ToolBtn>
                        <ToolBtn onClick={() => cmd('underline')} title="Underline (Ctrl+U)"><u style={{ fontSize: 13 }}>U</u></ToolBtn>
                        <ToolBtn onClick={() => cmd('strikeThrough')} title="Strikethrough"><s style={{ fontSize: 12 }}>S</s></ToolBtn>
                        <Sep />
                        <ToolBtn onClick={changeTextColor} title="Text Color">
                            <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <span style={{ fontWeight: 700, fontSize: 13, color: '#1d4ed8', lineHeight: 1 }}>A</span>
                                <span style={{ display: 'block', width: 14, height: 3, background: '#1d4ed8', borderRadius: 1, marginTop: 1 }} />
                            </span>
                        </ToolBtn>
                        <ToolBtn onClick={changeHighlight} title="Highlight">
                            <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <span style={{ fontWeight: 700, fontSize: 13, lineHeight: 1 }}>A</span>
                                <span style={{ display: 'block', width: 14, height: 3, background: '#fde047', borderRadius: 1, marginTop: 1 }} />
                            </span>
                        </ToolBtn>
                        <Sep />
                        <ToolBtn onClick={() => cmd('justifyLeft')} title="Align Left"><CsLineIcons icon="align-left" size={13} /></ToolBtn>
                        <ToolBtn onClick={() => cmd('justifyCenter')} title="Center"><CsLineIcons icon="align-center" size={13} /></ToolBtn>
                        <ToolBtn onClick={() => cmd('justifyRight')} title="Align Right"><CsLineIcons icon="align-right" size={13} /></ToolBtn>
                        <ToolBtn onClick={() => cmd('justifyFull')} title="Justify"><CsLineIcons icon="align-justify" size={13} /></ToolBtn>
                        <Sep />
                        <ToolBtn onClick={() => cmd('insertUnorderedList')} title="Bullet List"><CsLineIcons icon="list" size={13} /></ToolBtn>
                        <ToolBtn onClick={() => cmd('insertOrderedList')} title="Numbered List"><span style={{ fontSize: 11, fontWeight: 700 }}>1.</span></ToolBtn>
                        <ToolBtn onClick={() => cmd('indent')} title="Indent"><CsLineIcons icon="chevron-right" size={13} /></ToolBtn>
                        <ToolBtn onClick={() => cmd('outdent')} title="Outdent"><CsLineIcons icon="chevron-left" size={13} /></ToolBtn>
                        <Sep />
                        <ToolBtn onClick={insertTable} title="Insert Table">
                            <CsLineIcons icon="grid-1" size={13} />
                            <span style={{ fontSize: 11, marginLeft: 3 }}>Table</span>
                        </ToolBtn>
                        <ToolBtn onClick={insertPageBreak} title="Insert Page Break" danger>
                            <CsLineIcons icon="scissors" size={13} />
                            <span style={{ fontSize: 11, marginLeft: 3 }}>Page Break</span>
                        </ToolBtn>
                        <Sep />
                        <Dropdown>
                            <Dropdown.Toggle
                                variant="none"
                                size="sm"
                                id="insert-placeholder-dropdown"
                                style={{
                                    height: 28, fontSize: 12, fontWeight: 700, padding: '0 10px',
                                    border: '1px solid #1d4ed8', borderRadius: 3,
                                    background: '#eff6ff', color: '#1d4ed8',
                                    display: 'inline-flex', alignItems: 'center', gap: 4,
                                    whiteSpace: 'nowrap', flexShrink: 0, boxShadow: 'none',
                                    cursor: 'pointer',
                                }}
                            >
                                <CsLineIcons icon="plus" size={13} />
                                Insert Placeholder
                            </Dropdown.Toggle>
                            <Dropdown.Menu
                                renderOnMount
                                popperConfig={{ strategy: 'fixed' }}
                                style={{
                                    maxHeight: 320, overflowY: 'auto', zIndex: 9999,
                                    minWidth: 220, borderRadius: 8,
                                    border: '1px solid #e5e7eb',
                                    boxShadow: '0 8px 24px rgba(0,0,0,0.14)',
                                    padding: '4px 0',
                                }}
                            >
                                <div style={{ padding: '6px 12px 4px', borderBottom: '1px solid #f3f4f6' }}>
                                    <small style={{ fontWeight: 700, color: '#6b7280', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                        Click to insert at cursor
                                    </small>
                                </div>
                                {availablePlaceholders.map(ph => (
                                    <Dropdown.Item
                                        key={ph}
                                        onClick={() => insertHtml(`<span class="editor-placeholder" contenteditable="false">${ph}</span>`)}
                                        style={{ padding: '5px 12px', fontSize: 12 }}
                                    >
                                        <span style={{
                                            display: 'inline-block', background: '#dbeafe', color: '#1d4ed8',
                                            border: '1px solid #93c5fd', borderRadius: 3,
                                            padding: '1px 7px', fontWeight: 700, fontSize: 11,
                                        }}>
                                            {ph}
                                        </span>
                                    </Dropdown.Item>
                                ))}
                            </Dropdown.Menu>
                        </Dropdown>
                    </div>
                </div>
            )}

            {/* Editor Area */}
            {loading ? (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <Spinner animation="border" style={{ width: 40, height: 40, color: '#1d4ed8', borderWidth: 3 }} />
                    <div style={{ marginTop: 16, color: '#fff', fontWeight: 700, fontSize: 14 }}>Loading template…</div>
                </div>
            ) : isSourceView ? (
                <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ padding: '6px 16px', background: '#2d2d3f', color: '#a5b4fc', fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', flexShrink: 0 }}>
                        HTML SOURCE — Edit raw markup below
                    </div>
                    <textarea
                        value={wordEditorHtml}
                        onChange={e => setWordEditorHtml(e.target.value)}
                        style={{
                            flex: 1, width: '100%', background: '#1e1e2e', color: '#d4d4d4',
                            border: 'none', outline: 'none', padding: '12px 16px',
                            fontFamily: '"Consolas", "Fira Code", monospace',
                            fontSize: 13, lineHeight: 1.6, resize: 'none',
                        }}
                        spellCheck={false}
                    />
                </div>
            ) : (
                <iframe
                    ref={iframeRef}
                    title="Word Document Editor"
                    style={{ flex: 1, border: 'none', display: 'block', width: '100%' }}
                />
            )}
        </div>
    );
};

export default EditWordTemplate;
