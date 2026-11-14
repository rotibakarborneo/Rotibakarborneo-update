import React from 'react';

interface ChatMarkdownProps {
  text: string;
  compact?: boolean;
}

function renderInline(str: string): React.ReactNode[] {
  // Parse **bold**, *italic*, `code` cleanly without ever leaving raw markers behind
  const tokenRegex = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*\n]+\*)/g;
  const parts = str.split(tokenRegex);

  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return (
        <strong key={idx} className="font-bold text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      return (
        <code
          key={idx}
          className="px-1.5 py-0.5 rounded bg-white/10 text-sky-300 font-mono text-[11px]"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      return (
        <em key={idx} className="italic text-slate-200">
          {part.slice(1, -1)}
        </em>
      );
    }
    // Strip stray unmatched double asterisks if any
    return <React.Fragment key={idx}>{part.replace(/\*\*/g, '')}</React.Fragment>;
  });
}

export const ChatMarkdown: React.FC<ChatMarkdownProps> = ({ text, compact = false }) => {
  const lines = (text || '').replace(/\r\n/g, '\n').split('\n');
  const elements: React.ReactNode[] = [];

  let listItems: Array<{ ordered: boolean; indent: number; content: string }> = [];

  const flushList = (keyPrefix: string) => {
    if (listItems.length === 0) return;
    const isOrdered = listItems[0].ordered;
    const Tag = isOrdered ? 'ol' : 'ul';
    elements.push(
      <Tag
        key={`list-${keyPrefix}`}
        className={`${
          isOrdered ? 'list-decimal' : 'list-disc'
        } pl-4 space-y-1 my-1.5 text-slate-200 ${compact ? 'text-[11px]' : 'text-xs'}`}
      >
        {listItems.map((item, idx) => (
          <li
            key={idx}
            className={`leading-relaxed ${item.indent >= 2 ? 'ml-3 text-slate-300' : ''}`}
          >
            {renderInline(item.content)}
          </li>
        ))}
      </Tag>
    );
    listItems = [];
  };

  lines.forEach((rawLine, idx) => {
    const trimmed = rawLine.trim();
    if (!trimmed) {
      flushList(String(idx));
      return;
    }

    // Horizontal rule
    if (/^[-*_]{3,}$/.test(trimmed)) {
      flushList(String(idx));
      elements.push(<hr key={`hr-${idx}`} className="border-white/10 my-2" />);
      return;
    }

    // Markdown Heading (#, ##, ###)
    const headingMatch = trimmed.match(/^(#{1,3})\s+(.+)$/);
    if (headingMatch) {
      flushList(String(idx));
      elements.push(
        <p
          key={`h-${idx}`}
          className={`font-bold text-white mt-2 mb-1 ${
            compact ? 'text-xs' : 'text-[13px]'
          }`}
        >
          {renderInline(headingMatch[2])}
        </p>
      );
      return;
    }

    // Bullet item (- text or * text, including indented sub-bullets)
    const bulletMatch = rawLine.match(/^(\s*)([-*•])\s+(.+)$/);
    if (bulletMatch) {
      const indent = bulletMatch[1].length;
      if (listItems.length > 0 && listItems[0].ordered) {
        flushList(String(idx));
      }
      listItems.push({ ordered: false, indent, content: bulletMatch[3] });
      return;
    }

    // Numbered list item (1. text)
    const numMatch = rawLine.match(/^(\s*)\d+[.)]\s+(.+)$/);
    if (numMatch) {
      const indent = numMatch[1].length;
      if (listItems.length > 0 && !listItems[0].ordered) {
        flushList(String(idx));
      }
      listItems.push({ ordered: true, indent, content: numMatch[2] });
      return;
    }

    // Normal paragraph
    flushList(String(idx));
    elements.push(
      <p
        key={`p-${idx}`}
        className={`leading-relaxed text-slate-200 my-1 ${
          compact ? 'text-[11px]' : 'text-xs'
        }`}
      >
        {renderInline(trimmed)}
      </p>
    );
  });

  flushList('end');

  return <div className="space-y-0.5">{elements}</div>;
};
