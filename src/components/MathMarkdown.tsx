import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';

interface MathMarkdownProps {
  children: string;
  className?: string;
}

/**
 * Shared AI-answer renderer: Markdown (GFM tables, code, lists — Vietnamese
 * friendly) + KaTeX math for inline `$...$` and block `$$...$$`.
 *
 * Streaming-safe: while the typewriter is mid-formula (unclosed `$$` / `$`,
 * dangling `\left`, trailing `\`), delimiters are auto-balanced so KaTeX
 * never flashes raw `$`, `\frac`, `\cdot`, `\left` on screen.
 */
function balanceStreamingMath(input: string): string {
  let out = input;
  // Normalize \(...\) -> $...$ and \[...\] -> $$...$$ (some models emit these)
  out = out.replace(/\\\[\s*/g, '$$$$').replace(/\s*\\\]/g, '$$$$');
  out = out.replace(/\\\(\s*/g, '$').replace(/\s*\\\)/g, '$');

  // Promote single-line display formulas (`$$...$$` alone on a line) to true
  // block form so they render centered like ChatGPT (katex-display) instead
  // of inline. Only when the line holds exactly one pair — multi-pair lines
  // stay inline to avoid corrupting them.
  out = out
    .split('\n')
    .map((line) => {
      const m = line.match(/^(\s*)\$\$((?:(?!\$\$).)+)\$\$(\s*)$/);
      return m ? `${m[1]}$$\n${m[2].trim()}\n$$${m[3]}` : line;
    })
    .join('\n');

  // Strip fenced code blocks before counting delimiters so `$` in code
  // samples (e.g. shell snippets) doesn't corrupt balancing.
  const codeStripped = out.replace(/```[\s\S]*?(```|$)/g, '').replace(/`[^`\n]*`?/g, '');

  // Balance display math $$...$$.
  // Streaming nuance: an unclosed opener in the middle of a text line must be
  // closed on the SAME line (math-text), while an opener alone on its line is
  // a block fence and needs the closer on its own line (math-flow).
  const displayCount = (codeStripped.match(/\$\$/g) || []).length;
  if (displayCount % 2 === 1) {
    const lastOpen = out.lastIndexOf('$$');
    const lineStart = out.lastIndexOf('\n', lastOpen - 1) + 1;
    const beforeOnLine = out.slice(lineStart, lastOpen);
    out += beforeOnLine.trim() === '' ? '\n$$' : '$$';
  }

  // Balance inline math $...$ (after removing $$ pairs)
  const inlineStripped = codeStripped.replace(/\$\$/g, '');
  const inlineCount = (inlineStripped.match(/\$/g) || []).length;
  if (inlineCount % 2 === 1) out += '$';

  // Balance dangling \left (mid-stream) so KaTeX doesn't throw on unclosed
  // delimiters — the next streamed chunk completes the real \right.
  const leftCount = (out.match(/\\left[\s([{.|]/g) || []).length;
  const rightCount = (out.match(/\\right[\s)\]}.|]/g) || []).length;
  if (leftCount > rightCount) out += ' \\right.'.repeat(leftCount - rightCount);

  // A trailing lone backslash (e.g. mid "\frac") breaks KaTeX parsing —
  // drop it; the next streamed chunk re-adds the full command.
  if (/\\$/.test(out)) out = out.slice(0, -1);

  return out;
}

export const MathMarkdown: React.FC<MathMarkdownProps> = ({ children, className }) => {
  const content = useMemo(
    () => balanceStreamingMath(children ?? ''),
    [children]
  );

  return (
    <div className={`math-markdown ${className ?? ''}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          // Long display equations scroll instead of breaking layout
          table: ({ node, ...props }) => (
            <div className="math-md-table-wrap">
              <table {...props} />
            </div>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MathMarkdown;
