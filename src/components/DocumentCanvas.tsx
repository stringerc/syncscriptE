import { useState, useCallback, useRef, lazy, Suspense } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Underline } from '@tiptap/extension-underline';
import { TextAlign } from '@tiptap/extension-text-align';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { Highlight } from '@tiptap/extension-highlight';
import { Placeholder } from '@tiptap/extension-placeholder';
import { Button } from './ui/button';
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  AlignLeft, AlignCenter, AlignRight,
  List, ListOrdered, Table as TableIcon,
  Heading1, Heading2, Heading3,
  Undo, Redo, Download, FileText, Sheet, X, Maximize2, Minimize2,
  Highlighter, Type, Minus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { SpreadsheetCanvas } from './SpreadsheetCanvas';

interface DocumentCanvasProps {
  title: string;
  content: string;
  format?: 'document' | 'spreadsheet' | 'invoice';
  onClose: () => void;
  onTitleChange?: (title: string) => void;
}

function markdownTableToHtml(md: string): string {
  const lines = md.split('\n');
  const result: string[] = [];
  let inTable = false;
  let isFirstRow = true;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('|') && trimmed.endsWith('|') && trimmed.includes('|')) {
      const cells = trimmed.split('|').slice(1, -1).map((c) => c.trim());
      if (/^[\s:-]+$/.test(cells.join(''))) continue;
      if (!inTable) {
        result.push('<table>');
        inTable = true;
        isFirstRow = true;
      }
      const tag = isFirstRow ? 'th' : 'td';
      result.push('<tr>' + cells.map((c) => `<${tag}>${c}</${tag}>`).join('') + '</tr>');
      isFirstRow = false;
    } else {
      if (inTable) {
        result.push('</table>');
        inTable = false;
      }
      result.push(line);
    }
  }
  if (inTable) result.push('</table>');
  return result.join('\n');
}

function markdownToHtml(md: string): string {
  let html = markdownTableToHtml(md);
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>\n?)+/g, (match) => `<ul>${match}</ul>`);
  html = html.replace(/^(\d+)\. (.+)$/gm, '<li>$2</li>');
  html = html.replace(/^---$/gm, '<hr>');
  const lines = html.split('\n');
  const result: string[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) { result.push('<p><br></p>'); continue; }
    if (/^<(h[1-6]|ul|ol|li|hr|table|tr|td|th|blockquote|pre)/.test(trimmed)) {
      result.push(trimmed);
    } else {
      result.push(`<p>${trimmed}</p>`);
    }
  }
  return result.join('');
}

export function DocumentCanvas({ title, content, format = 'document', onClose, onTitleChange }: DocumentCanvasProps) {
  if (format === 'spreadsheet') {
    return (
      <SpreadsheetCanvas
        title={title}
        content={content}
        onClose={onClose}
        onTitleChange={onTitleChange}
      />
    );
  }
  const [docTitle, setDocTitle] = useState(title);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      Highlight,
      Placeholder.configure({ placeholder: 'Start writing...' }),
    ],
    content: markdownToHtml(content),
    editorProps: {
      attributes: {
        class: 'nexus-doc-editor focus:outline-none min-h-[300px]',
      },
    },
  });

  const handleTitleChange = useCallback((val: string) => {
    setDocTitle(val);
    onTitleChange?.(val);
  }, [onTitleChange]);

  const exportPdf = useCallback(() => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const html = editor?.getHTML() || '';
    printWindow.document.write(`<!DOCTYPE html><html><head><title>${docTitle}</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Merriweather:wght@400;700&display=swap" rel="stylesheet">
      <style>
        @page { size: letter; margin: 1in 1.15in; }
        body { font-family: 'Merriweather', Georgia, 'Times New Roman', serif; max-width: 6.5in; margin: 0 auto; padding: 0.75in 0; color: #1a1a2e; line-height: 1.75; font-size: 10.5pt; -webkit-font-smoothing: antialiased; }
        h1 { font-family: 'Inter', -apple-system, sans-serif; font-size: 22pt; font-weight: 700; margin: 0 0 6pt; color: #0f172a; letter-spacing: -0.025em; line-height: 1.2; }
        h2 { font-family: 'Inter', -apple-system, sans-serif; font-size: 15pt; font-weight: 600; margin: 18pt 0 6pt; color: #1e293b; letter-spacing: -0.015em; border-bottom: 1.5pt solid #e2e8f0; padding-bottom: 4pt; }
        h3 { font-family: 'Inter', -apple-system, sans-serif; font-size: 12pt; font-weight: 600; margin: 14pt 0 4pt; color: #334155; }
        p { margin: 6pt 0; orphans: 3; widows: 3; }
        strong { font-weight: 700; color: #0f172a; }
        em { font-style: italic; }
        ul, ol { margin: 8pt 0; padding-left: 22pt; }
        li { margin: 3pt 0; }
        li::marker { color: #6366f1; }
        table { width: 100%; border-collapse: collapse; margin: 14pt 0; font-family: 'Inter', sans-serif; font-size: 9.5pt; }
        thead { background: #f8fafc; }
        th { border: 1pt solid #cbd5e1; padding: 8pt 12pt; text-align: left; font-weight: 600; color: #1e293b; text-transform: uppercase; font-size: 8.5pt; letter-spacing: 0.05em; }
        td { border: 1pt solid #e2e8f0; padding: 7pt 12pt; color: #334155; }
        tr:nth-child(even) td { background: #f8fafc; }
        hr { border: none; border-top: 1.5pt solid #e2e8f0; margin: 20pt 0; }
        mark { background: #fef3c7; padding: 1pt 3pt; border-radius: 2pt; }
        blockquote { border-left: 3pt solid #6366f1; margin: 12pt 0; padding: 8pt 16pt; background: #f8fafc; color: #475569; font-style: italic; }
        @media print { body { margin: 0; padding: 0; } }
      </style>
    </head><body>${html}</body></html>`);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); }, 400);
  }, [editor, docTitle]);

  const exportDocx = useCallback(async () => {
    const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, TableRow: DRow, TableCell: DCell, Table: DTable, WidthType, BorderStyle } = await import('docx');
    const { saveAs } = await import('file-saver');

    const html = editor?.getHTML() || '';
    const div = document.createElement('div');
    div.innerHTML = html;

    const BODY_SIZE = 22;
    const H1_SIZE = 44;
    const H2_SIZE = 32;
    const H3_SIZE = 26;
    const TABLE_SIZE = 20;

    function parseInlineRuns(parent: Element): any[] {
      const runs: any[] = [];
      for (const child of Array.from(parent.childNodes)) {
        if (child.nodeType === Node.TEXT_NODE) {
          runs.push(new TextRun({ text: child.textContent || '', size: BODY_SIZE, font: 'Georgia' }));
        } else {
          const el = child as HTMLElement;
          const t = el.textContent || '';
          const isBold = el.tagName === 'STRONG' || el.tagName === 'B';
          const isItalic = el.tagName === 'EM' || el.tagName === 'I';
          const isUnderline = el.tagName === 'U';
          runs.push(new TextRun({ text: t, size: BODY_SIZE, font: 'Georgia', bold: isBold, italics: isItalic, underline: isUnderline ? {} : undefined }));
        }
      }
      return runs;
    }

    const children: any[] = [];
    for (const node of Array.from(div.childNodes) as HTMLElement[]) {
      const tag = node.tagName?.toLowerCase() || '';
      const text = node.textContent || '';

      if (tag === 'h1') {
        children.push(new Paragraph({ children: [new TextRun({ text, size: H1_SIZE, font: 'Calibri', bold: true, color: '0F172A' })], spacing: { after: 120 } }));
      } else if (tag === 'h2') {
        children.push(new Paragraph({ children: [new TextRun({ text, size: H2_SIZE, font: 'Calibri', bold: true, color: '1E293B' })], spacing: { before: 360, after: 120 }, border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: 'E2E8F0' } } }));
      } else if (tag === 'h3') {
        children.push(new Paragraph({ children: [new TextRun({ text, size: H3_SIZE, font: 'Calibri', bold: true, color: '334155' })], spacing: { before: 240, after: 80 } }));
      } else if (tag === 'ul' || tag === 'ol') {
        const items = node.querySelectorAll('li');
        items.forEach((li) => {
          children.push(new Paragraph({
            children: [new TextRun({ text: li.textContent || '', size: BODY_SIZE, font: 'Georgia' })],
            bullet: tag === 'ul' ? { level: 0 } : undefined,
            numbering: tag === 'ol' ? { reference: 'default-numbering', level: 0 } : undefined,
            spacing: { after: 60 },
          }));
        });
      } else if (tag === 'table') {
        const rows = node.querySelectorAll('tr');
        const dRows = Array.from(rows).map((tr, ri) => {
          const cells = tr.querySelectorAll('td, th');
          const isHeader = ri === 0 && tr.querySelector('th');
          return new DRow({
            tableHeader: !!isHeader,
            children: Array.from(cells).map((cell) =>
              new DCell({
                children: [new Paragraph({ children: [new TextRun({ text: cell.textContent || '', size: TABLE_SIZE, font: 'Calibri', bold: !!isHeader })] })],
                width: { size: 100 / cells.length, type: WidthType.PERCENTAGE },
                shading: isHeader ? { fill: 'F1F5F9' } : undefined,
              })
            ),
          });
        });
        if (dRows.length > 0) {
          children.push(new DTable({ rows: dRows, width: { size: 100, type: WidthType.PERCENTAGE } }));
          children.push(new Paragraph({ children: [], spacing: { after: 120 } }));
        }
      } else if (tag === 'hr') {
        children.push(new Paragraph({ children: [], spacing: { before: 200, after: 200 }, border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: 'E2E8F0' } } }));
      } else {
        const runs = parseInlineRuns(node);
        if (runs.length === 0 && text) runs.push(new TextRun({ text, size: BODY_SIZE, font: 'Georgia' }));
        const align = node.style?.textAlign;
        children.push(new Paragraph({
          children: runs,
          alignment: align === 'center' ? AlignmentType.CENTER : align === 'right' ? AlignmentType.RIGHT : undefined,
          spacing: { after: 120, line: 340 },
        }));
      }
    }

    const doc = new Document({
      sections: [{ children }],
      numbering: {
        config: [{ reference: 'default-numbering', levels: [{ level: 0, format: 'decimal', text: '%1.', alignment: AlignmentType.LEFT }] }],
      },
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `${docTitle.replace(/[^a-zA-Z0-9\s-]/g, '').trim() || 'document'}.docx`);
  }, [editor, docTitle]);

  const exportXlsx = useCallback(async () => {
    const XLSX = await import('xlsx');
    const { saveAs } = await import('file-saver');
    const html = editor?.getHTML() || '';
    const div = document.createElement('div');
    div.innerHTML = html;

    const table = div.querySelector('table');
    let wsData: string[][] = [];
    if (table) {
      const rows = table.querySelectorAll('tr');
      wsData = Array.from(rows).map((tr) =>
        Array.from(tr.querySelectorAll('td, th')).map((cell) => cell.textContent || '')
      );
    } else {
      const lines = (editor?.getText() || '').split('\n').filter(Boolean);
      wsData = lines.map((line) => [line]);
    }

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([buf], { type: 'application/octet-stream' }), `${docTitle.replace(/[^a-zA-Z0-9\s-]/g, '').trim() || 'spreadsheet'}.xlsx`);
  }, [editor, docTitle]);

  if (!editor) return null;

  return (
    <div className={cn(
      'flex flex-col border-l border-gray-800 shrink-0',
      isFullscreen ? 'fixed inset-0 z-50 bg-[#13141a]' : 'w-full md:w-[50vw] md:max-w-[720px] md:min-w-[400px] fixed md:relative inset-0 md:inset-auto z-50 md:z-auto bg-[#13141a]',
    )}>
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-800 bg-[#1a1b23]">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <FileText className="w-4 h-4 text-purple-400 shrink-0" />
          <input
            value={docTitle}
            onChange={(e) => handleTitleChange(e.target.value)}
            className="text-sm font-medium bg-transparent border-none outline-none flex-1 min-w-0 truncate text-white placeholder:text-gray-500"
            placeholder="Untitled document"
          />
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button className="h-7 w-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors" onClick={() => setIsFullscreen(!isFullscreen)} title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}>
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
          <button className="h-7 w-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors" onClick={onClose} title="Close">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-0.5 px-3 py-1.5 border-b border-gray-800 bg-[#1a1b23]/50 overflow-x-auto">
        <ToolbarBtn icon={Bold} active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()} title="Bold" />
        <ToolbarBtn icon={Italic} active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} title="Italic" />
        <ToolbarBtn icon={UnderlineIcon} active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()} title="Underline" />
        <ToolbarBtn icon={Strikethrough} active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()} title="Strikethrough" />
        <ToolbarBtn icon={Highlighter} active={editor.isActive('highlight')} onClick={() => editor.chain().focus().toggleHighlight().run()} title="Highlight" />
        <div className="w-px h-5 bg-gray-700 mx-1" />
        <ToolbarBtn icon={Heading1} active={editor.isActive('heading', { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} title="Heading 1" />
        <ToolbarBtn icon={Heading2} active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} title="Heading 2" />
        <ToolbarBtn icon={Heading3} active={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} title="Heading 3" />
        <ToolbarBtn icon={Type} active={!editor.isActive('heading')} onClick={() => editor.chain().focus().setParagraph().run()} title="Normal text" />
        <div className="w-px h-5 bg-gray-700 mx-1" />
        <ToolbarBtn icon={AlignLeft} active={editor.isActive({ textAlign: 'left' })} onClick={() => editor.chain().focus().setTextAlign('left').run()} title="Align left" />
        <ToolbarBtn icon={AlignCenter} active={editor.isActive({ textAlign: 'center' })} onClick={() => editor.chain().focus().setTextAlign('center').run()} title="Align center" />
        <ToolbarBtn icon={AlignRight} active={editor.isActive({ textAlign: 'right' })} onClick={() => editor.chain().focus().setTextAlign('right').run()} title="Align right" />
        <div className="w-px h-5 bg-gray-700 mx-1" />
        <ToolbarBtn icon={List} active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()} title="Bullet list" />
        <ToolbarBtn icon={ListOrdered} active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Numbered list" />
        <ToolbarBtn icon={Minus} active={false} onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Horizontal rule" />
        <ToolbarBtn icon={TableIcon} active={editor.isActive('table')} onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} title="Insert table" />
        <div className="w-px h-5 bg-gray-700 mx-1" />
        <ToolbarBtn icon={Undo} active={false} onClick={() => editor.chain().focus().undo().run()} title="Undo" />
        <ToolbarBtn icon={Redo} active={false} onClick={() => editor.chain().focus().redo().run()} title="Redo" />
      </div>

      <div className="flex-1 overflow-y-auto bg-[#0f1015]" ref={printRef}>
        <EditorContent editor={editor} />
        <style>{`
          .nexus-doc-editor { max-width: 680px; margin: 0 auto; padding: 40px 48px; font-family: 'Georgia', 'Times New Roman', serif; color: #e2e8f0; line-height: 1.8; font-size: 14px; }
          .nexus-doc-editor h1 { font-family: -apple-system, 'Segoe UI', sans-serif; font-size: 28px; font-weight: 700; color: #f8fafc; margin: 0 0 8px; letter-spacing: -0.025em; line-height: 1.25; }
          .nexus-doc-editor h2 { font-family: -apple-system, 'Segoe UI', sans-serif; font-size: 20px; font-weight: 600; color: #f1f5f9; margin: 28px 0 8px; letter-spacing: -0.015em; padding-bottom: 6px; border-bottom: 1px solid #334155; }
          .nexus-doc-editor h3 { font-family: -apple-system, 'Segoe UI', sans-serif; font-size: 16px; font-weight: 600; color: #e2e8f0; margin: 20px 0 6px; }
          .nexus-doc-editor p { margin: 8px 0; }
          .nexus-doc-editor strong { font-weight: 700; color: #f8fafc; }
          .nexus-doc-editor em { font-style: italic; color: #cbd5e1; }
          .nexus-doc-editor ul, .nexus-doc-editor ol { margin: 10px 0; padding-left: 24px; }
          .nexus-doc-editor li { margin: 4px 0; color: #cbd5e1; }
          .nexus-doc-editor li::marker { color: #818cf8; }
          .nexus-doc-editor table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 13px; }
          .nexus-doc-editor th { background: #1e293b; color: #e2e8f0; font-weight: 600; text-transform: uppercase; font-size: 11px; letter-spacing: 0.06em; padding: 10px 14px; border: 1px solid #334155; text-align: left; }
          .nexus-doc-editor td { padding: 9px 14px; border: 1px solid #1e293b; color: #cbd5e1; }
          .nexus-doc-editor tr:nth-child(even) td { background: #0f172a; }
          .nexus-doc-editor tr:hover td { background: #1e293b; }
          .nexus-doc-editor hr { border: none; border-top: 1px solid #334155; margin: 24px 0; }
          .nexus-doc-editor mark { background: #854d0e; color: #fef3c7; padding: 1px 4px; border-radius: 2px; }
          .nexus-doc-editor blockquote { border-left: 3px solid #818cf8; margin: 14px 0; padding: 10px 18px; background: #1e293b; color: #94a3b8; border-radius: 0 6px 6px 0; }
          .nexus-doc-editor a { color: #818cf8; text-decoration: underline; }
          .nexus-doc-editor p:first-child { margin-top: 0; }
          .nexus-doc-editor .is-empty::before { color: #475569; }
        `}</style>
      </div>

      <div className="flex items-center justify-between px-4 py-2 border-t border-gray-800 bg-[#1a1b23]">
        <span className="text-xs text-gray-500">
          {editor.storage.characterCount?.characters?.() ?? editor.getText().length} characters
        </span>
        <div className="flex items-center gap-2">
          <button onClick={exportPdf} className="h-7 px-3 flex items-center gap-1.5 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-300 hover:bg-purple-500/20 transition-colors text-xs font-medium">
            <Download className="w-3 h-3" /> PDF
          </button>
          <button onClick={exportDocx} className="h-7 px-3 flex items-center gap-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20 transition-colors text-xs font-medium">
            <FileText className="w-3 h-3" /> DOCX
          </button>
          <button onClick={exportXlsx} className="h-7 px-3 flex items-center gap-1.5 rounded-lg bg-green-500/10 border border-green-500/30 text-green-300 hover:bg-green-500/20 transition-colors text-xs font-medium">
            <Sheet className="w-3 h-3" /> XLSX
          </button>
        </div>
      </div>
    </div>
  );
}

function ToolbarBtn({ icon: Icon, active, onClick, title }: { icon: any; active: boolean; onClick: () => void; title: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        'p-1.5 rounded transition-colors text-gray-400 hover:text-white hover:bg-gray-700',
        active && 'bg-purple-500/20 text-purple-300',
      )}
    >
      <Icon className="w-3.5 h-3.5" />
    </button>
  );
}
