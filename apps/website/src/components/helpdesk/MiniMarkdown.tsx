import { Fragment, type ReactNode } from 'react';

// A deliberately small markdown subset for rendering Gemini's answers —
// paragraphs, headings, bullet/numbered lists, bold, and links. No markdown
// dependency exists in this project yet, and pulling one in for this alone
// isn't justified; this covers what a grounded documentation answer
// actually produces.

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  // Bold (**text**) and links ([text](url)), in one pass, left to right.
  const pattern = /\*\*(.+?)\*\*|\[(.+?)\]\((https?:\/\/[^\s)]+)\)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let i = 0;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(<Fragment key={`${keyPrefix}-t${i++}`}>{text.slice(lastIndex, match.index)}</Fragment>);
    }
    if (match[1] !== undefined) {
      nodes.push(<strong key={`${keyPrefix}-b${i++}`}>{match[1]}</strong>);
    } else {
      nodes.push(
        <a
          key={`${keyPrefix}-a${i++}`}
          href={match[3]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-brand-700 underline underline-offset-2 hover:text-brand-800 dark:text-brand-400 dark:hover:text-brand-300"
        >
          {match[2]}
        </a>,
      );
    }
    lastIndex = pattern.lastIndex;
  }
  if (lastIndex < text.length) {
    nodes.push(<Fragment key={`${keyPrefix}-t${i++}`}>{text.slice(lastIndex)}</Fragment>);
  }
  return nodes;
}

interface Block {
  type: 'heading' | 'bullet-list' | 'numbered-list' | 'paragraph';
  level?: number;
  items?: string[];
  text?: string;
}

function parseBlocks(markdown: string): Block[] {
  const lines = markdown.split('\n');
  const blocks: Block[] = [];
  let currentParagraph: string[] = [];
  let currentList: { ordered: boolean; items: string[] } | null = null;

  const flushParagraph = () => {
    if (currentParagraph.length > 0) {
      blocks.push({ type: 'paragraph', text: currentParagraph.join(' ') });
      currentParagraph = [];
    }
  };
  const flushList = () => {
    if (currentList) {
      blocks.push({ type: currentList.ordered ? 'numbered-list' : 'bullet-list', items: currentList.items });
      currentList = null;
    }
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (line.length === 0) {
      flushParagraph();
      flushList();
      continue;
    }

    const heading = line.match(/^(#{1,3})\s+(.*)$/);
    if (heading) {
      flushParagraph();
      flushList();
      blocks.push({ type: 'heading', level: heading[1].length, text: heading[2] });
      continue;
    }

    const bullet = line.match(/^[-*•]\s+(.*)$/);
    const numbered = line.match(/^\d+[.)]\s+(.*)$/);
    if (bullet || numbered) {
      flushParagraph();
      const ordered = !!numbered;
      if (!currentList || currentList.ordered !== ordered) {
        flushList();
        currentList = { ordered, items: [] };
      }
      currentList.items.push((bullet ?? numbered)![1]);
      continue;
    }

    flushList();
    currentParagraph.push(line);
  }
  flushParagraph();
  flushList();

  return blocks;
}

const HEADING_STYLES: Record<number, string> = {
  1: 'text-base font-bold',
  2: 'text-sm font-bold',
  3: 'text-sm font-semibold',
};

export function MiniMarkdown({ text }: { text: string }) {
  const blocks = parseBlocks(text);

  return (
    <div className="space-y-2">
      {blocks.map((block, i) => {
        const key = `block-${i}`;
        if (block.type === 'heading') {
          return (
            <p key={key} className={`${HEADING_STYLES[block.level ?? 2]} text-slate-900 dark:text-white`}>
              {renderInline(block.text ?? '', key)}
            </p>
          );
        }
        if (block.type === 'bullet-list') {
          return (
            <ul key={key} className="list-disc space-y-1 pl-5">
              {block.items!.map((item, j) => (
                <li key={`${key}-${j}`}>{renderInline(item, `${key}-${j}`)}</li>
              ))}
            </ul>
          );
        }
        if (block.type === 'numbered-list') {
          return (
            <ol key={key} className="list-decimal space-y-1 pl-5">
              {block.items!.map((item, j) => (
                <li key={`${key}-${j}`}>{renderInline(item, `${key}-${j}`)}</li>
              ))}
            </ol>
          );
        }
        return <p key={key}>{renderInline(block.text ?? '', key)}</p>;
      })}
    </div>
  );
}
