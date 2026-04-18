import { useState, useCallback, useMemo } from 'react';
import Spreadsheet, { type CellBase, type Matrix } from 'react-spreadsheet';
import { Download, FileText, Sheet, X, Maximize2, Minimize2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SpreadsheetCanvasProps {
  title: string;
  content: string;
  onClose: () => void;
  onTitleChange?: (title: string) => void;
}

function parseMarkdownTable(md: string): { headers: string[]; rows: string[][] } {
  const lines = md.split('\n').map((l) => l.trim()).filter(Boolean);
  const tableLines: string[] = [];
  for (const line of lines) {
    if (line.startsWith('|') || (line.includes('|') && /^[\s|:-]+$/.test(line))) {
      tableLines.push(line);
    }
  }

  if (tableLines.length < 2) {
    const fallbackLines = md.split('\n').filter((l) => l.trim());
    return {
      headers: ['A'],
      rows: fallbackLines.map((l) => [l.replace(/^#+\s*/, '').trim()]),
    };
  }

  const parseLine = (line: string): string[] =>
    line.split('|').map((c) => c.trim()).filter((_, i, arr) => i > 0 && i < arr.length);

  const headers = parseLine(tableLines[0]);
  const isSeparator = (line: string) => /^[\s|:-]+$/.test(line.replace(/\|/g, ''));
  const dataLines = tableLines.filter((l, i) => i > 0 && !isSeparator(l));
  const rows = dataLines.map(parseLine);

  return { headers, rows };
}

function toSpreadsheetData(headers: string[], rows: string[][]): Matrix<CellBase> {
  const colCount = Math.max(headers.length, ...rows.map((r) => r.length));
  const headerRow: CellBase[] = Array.from({ length: colCount }, (_, i) => ({
    value: headers[i] || '',
  }));
  const dataRows: CellBase[][] = rows.map((row) =>
    Array.from({ length: colCount }, (_, i) => ({ value: row[i] || '' })),
  );
  return [headerRow, ...dataRows];
}

export function SpreadsheetCanvas({ title, content, onClose, onTitleChange }: SpreadsheetCanvasProps) {
  const [docTitle, setDocTitle] = useState(title);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const { headers, rows } = useMemo(() => parseMarkdownTable(content), [content]);
  const [data, setData] = useState<Matrix<CellBase>>(() => toSpreadsheetData(headers, rows));

  const columnLabels = useMemo(() => {
    const colCount = data[0]?.length || 0;
    return Array.from({ length: colCount }, (_, i) => String.fromCharCode(65 + (i % 26)) + (i >= 26 ? String(Math.floor(i / 26)) : ''));
  }, [data]);

  const handleTitleChange = useCallback((val: string) => {
    setDocTitle(val);
    onTitleChange?.(val);
  }, [onTitleChange]);

  const exportXlsx = useCallback(async () => {
    const XLSX = await import('xlsx');
    const { saveAs } = await import('file-saver');
    const wsData = data.map((row) => (row || []).map((cell) => (cell as CellBase)?.value ?? ''));
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([buf], { type: 'application/octet-stream' }), `${docTitle.replace(/[^a-zA-Z0-9\s-]/g, '').trim() || 'spreadsheet'}.xlsx`);
  }, [data, docTitle]);

  const exportCsv = useCallback(() => {
    const csvContent = data
      .map((row) => (row || []).map((cell) => {
        const val = String((cell as CellBase)?.value ?? '');
        return val.includes(',') || val.includes('"') || val.includes('\n') ? `"${val.replace(/"/g, '""')}"` : val;
      }).join(','))
      .join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${docTitle.replace(/[^a-zA-Z0-9\s-]/g, '').trim() || 'spreadsheet'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [data, docTitle]);

  return (
    <div className={cn(
      'flex flex-col border-l border-gray-800 shrink-0',
      isFullscreen ? 'fixed inset-0 z-50 bg-[#13141a]' : 'w-full md:w-[50vw] md:max-w-[720px] md:min-w-[400px] fixed md:relative inset-0 md:inset-auto z-50 md:z-auto bg-[#13141a]',
    )}>
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-800 bg-[#1a1b23]">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Sheet className="w-4 h-4 text-green-400 shrink-0" />
          <input
            value={docTitle}
            onChange={(e) => handleTitleChange(e.target.value)}
            className="text-sm font-medium bg-transparent border-none outline-none flex-1 min-w-0 truncate text-white placeholder:text-gray-500"
            placeholder="Untitled spreadsheet"
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

      <div className="flex-1 overflow-auto bg-[#0f1015] p-4">
        <div className="spreadsheet-dark-theme">
          <Spreadsheet
            data={data}
            onChange={setData}
            columnLabels={columnLabels}
          />
        </div>
        <style>{`
          .spreadsheet-dark-theme .Spreadsheet { font-family: -apple-system, 'Segoe UI', 'Inter', sans-serif; font-size: 13px; border-radius: 8px; overflow: hidden; border: 1px solid #1e293b; }
          .spreadsheet-dark-theme .Spreadsheet__header { background: linear-gradient(180deg, #1e293b 0%, #1a2332 100%); color: #94a3b8; font-weight: 600; font-size: 11px; letter-spacing: 0.03em; border-color: #1e293b; }
          .spreadsheet-dark-theme .Spreadsheet__cell { background: #0f172a; color: #e2e8f0; border-color: #1e293b; min-width: 120px; transition: background 0.1s; }
          .spreadsheet-dark-theme .Spreadsheet__cell--selected { box-shadow: inset 0 0 0 2px #6366f1; background: #1e1b4b; }
          .spreadsheet-dark-theme .Spreadsheet__active-cell { background: #1e1b4b; }
          .spreadsheet-dark-theme .Spreadsheet__cell:first-child { background: linear-gradient(90deg, #1e293b 0%, #1a2332 100%); color: #94a3b8; font-weight: 600; font-size: 11px; min-width: 48px; text-align: center; }
          .spreadsheet-dark-theme table { border-collapse: collapse; }
          .spreadsheet-dark-theme td, .spreadsheet-dark-theme th { padding: 8px 14px; }
          .spreadsheet-dark-theme tr:nth-child(even) .Spreadsheet__cell { background: #0c1220; }
          .spreadsheet-dark-theme .Spreadsheet__cell input { background: #1e1b4b; color: #e2e8f0; border: none; outline: none; font-size: 13px; padding: 0; }
        `}</style>
      </div>

      <div className="flex items-center justify-between px-4 py-2 border-t border-gray-800 bg-[#1a1b23]">
        <span className="text-xs text-gray-500">
          {data.length} rows x {data[0]?.length || 0} columns
        </span>
        <div className="flex items-center gap-2">
          <button onClick={exportXlsx} className="h-7 px-3 flex items-center gap-1.5 rounded-lg bg-green-500/10 border border-green-500/30 text-green-300 hover:bg-green-500/20 transition-colors text-xs font-medium">
            <Download className="w-3 h-3" /> XLSX
          </button>
          <button onClick={exportCsv} className="h-7 px-3 flex items-center gap-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20 transition-colors text-xs font-medium">
            <FileText className="w-3 h-3" /> CSV
          </button>
        </div>
      </div>
    </div>
  );
}
