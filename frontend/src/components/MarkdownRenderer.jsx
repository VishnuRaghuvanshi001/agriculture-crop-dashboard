import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

/**
 * Custom Lightweight Markdown & Rich Content Renderer
 * ===================================================
 * Renders LLM responses into styled cyberpunk glassmorphic elements:
 * headers, lists, bold/italic, code blocks with copy, tables, and callouts.
 */
export default function MarkdownRenderer({ content }) {
  if (!content) return null;

  // Split content by code blocks first
  const parts = [];
  const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push({
        type: 'text',
        value: content.slice(lastIndex, match.index)
      });
    }
    parts.push({
      type: 'code',
      lang: match[1] || 'text',
      value: match[2].trim()
    });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    parts.push({
      type: 'text',
      value: content.slice(lastIndex)
    });
  }

  return (
    <div className="space-y-3 leading-relaxed text-slate-200 text-sm">
      {parts.map((part, pIdx) => {
        if (part.type === 'code') {
          return <CodeBlock key={pIdx} code={part.value} lang={part.lang} />;
        }
        return <FormattedText key={pIdx} text={part.value} />;
      })}
    </div>
  );
}

function CodeBlock({ code, lang }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard?.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-3 rounded-xl overflow-hidden border border-cyan-500/20 bg-slate-950/80 font-mono text-xs shadow-lg">
      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900/90 border-b border-cyan-500/15 text-[11px] text-slate-400">
        <span className="text-cyan-400 font-semibold uppercase">{lang || 'CODE'}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-slate-400 hover:text-cyan-300 transition-colors py-0.5 px-2 rounded hover:bg-slate-800"
        >
          {copied ? (
            <>
              <Check size={12} className="text-emerald-400" />
              <span className="text-emerald-400 text-[10px]">Copied</span>
            </>
          ) : (
            <>
              <Copy size={12} />
              <span className="text-[10px]">Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-3 overflow-x-auto text-emerald-300 leading-snug">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function FormattedText({ text }) {
  const lines = text.split('\n');
  const elements = [];
  let currentList = [];
  let inTable = false;
  let tableRows = [];

  const flushList = () => {
    if (currentList.length > 0) {
      elements.push(
        <ul key={`ul-${elements.length}`} className="my-2 space-y-1.5 pl-4 list-none">
          {currentList.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <span className="text-cyan-400 text-xs mt-1 shrink-0 font-bold">•</span>
              <span className="flex-1">{renderInline(item)}</span>
            </li>
          ))}
        </ul>
      );
      currentList = [];
    }
  };

  const flushTable = () => {
    if (tableRows.length > 0) {
      elements.push(
        <div key={`table-${elements.length}`} className="my-3 overflow-x-auto rounded-xl border border-slate-700/60 shadow-md">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/90 text-cyan-400 border-b border-slate-700/60 font-semibold">
                {tableRows[0].map((cell, cIdx) => (
                  <th key={cIdx} className="px-3 py-2 border-r border-slate-800 last:border-r-0">
                    {renderInline(cell)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 bg-slate-950/40">
              {tableRows.slice(1).map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-slate-800/40 transition-colors">
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="px-3 py-2 border-r border-slate-800/60 last:border-r-0 text-slate-300">
                      {renderInline(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      tableRows = [];
      inTable = false;
    }
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();

    // Table line: e.g. | col1 | col2 |
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      flushList();
      // Skip delimiter lines like |---|---|
      if (trimmed.match(/^\|[\s-:]+\|$/) || trimmed.replace(/[|\s-:]/g, '') === '') {
        return;
      }
      const cells = trimmed
        .slice(1, -1)
        .split('|')
        .map(c => c.trim());
      tableRows.push(cells);
      inTable = true;
      return;
    } else if (inTable) {
      flushTable();
    }

    // Unordered list item
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.startsWith('• ')) {
      currentList.push(trimmed.slice(2).trim());
      return;
    }

    // Numbered list item: e.g. "1. "
    const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
    if (numMatch) {
      flushList();
      elements.push(
        <div key={`num-${idx}`} className="flex items-start gap-2 my-1 pl-2">
          <span className="font-mono text-cyan-400 text-xs font-bold shrink-0">{numMatch[1]}.</span>
          <span className="flex-1">{renderInline(numMatch[2])}</span>
        </div>
      );
      return;
    }

    flushList();

    if (!trimmed) {
      // Empty line -> spacing
      return;
    }

    // Headers
    if (trimmed.startsWith('### ')) {
      elements.push(
        <h4 key={`h3-${idx}`} className="text-base font-bold text-cyan-300 mt-4 mb-1.5 flex items-center gap-1.5">
          {renderInline(trimmed.slice(4))}
        </h4>
      );
      return;
    }
    if (trimmed.startsWith('## ')) {
      elements.push(
        <h3 key={`h2-${idx}`} className="text-lg font-extrabold text-cyan-400 mt-5 mb-2 border-b border-cyan-500/20 pb-1">
          {renderInline(trimmed.slice(3))}
        </h3>
      );
      return;
    }
    if (trimmed.startsWith('# ')) {
      elements.push(
        <h2 key={`h1-${idx}`} className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400 mt-5 mb-2">
          {renderInline(trimmed.slice(2))}
        </h2>
      );
      return;
    }

    // Blockquote
    if (trimmed.startsWith('> ')) {
      elements.push(
        <div
          key={`quote-${idx}`}
          className="my-2.5 p-3 rounded-xl border-l-4 border-cyan-400 bg-cyan-950/20 text-slate-300 text-xs italic"
        >
          {renderInline(trimmed.slice(2))}
        </div>
      );
      return;
    }

    // Regular paragraph
    elements.push(
      <p key={`p-${idx}`} className="my-1.5">
        {renderInline(line)}
      </p>
    );
  });

  flushList();
  flushTable();

  return <>{elements}</>;
}

/**
 * Handles inline formatting: bold (**text**), italic (*text*), inline code (`code`), links
 */
function renderInline(text) {
  if (!text) return '';

  // Process inline code, bold, italic
  const parts = [];
  const regex = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    const token = match[0];
    if (token.startsWith('`') && token.endsWith('`')) {
      parts.push(
        <code
          key={parts.length}
          className="px-1.5 py-0.5 rounded bg-slate-800/90 text-cyan-300 font-mono text-[11px] border border-cyan-500/30"
        >
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith('**') && token.endsWith('**')) {
      parts.push(
        <strong key={parts.length} className="font-bold text-slate-100">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith('*') && token.endsWith('*')) {
      parts.push(
        <em key={parts.length} className="italic text-slate-300">
          {token.slice(1, -1)}
        </em>
      );
    }

    lastIndex = match.index + token.length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}
