import { Fragment, ReactNode } from 'react';

const renderInlineMarkdown = (value: string): ReactNode[] => {
  const tokens: ReactNode[] = [];
  const pattern = /(\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let cursor = 0;
  let match = pattern.exec(value);

  while (match) {
    if (match.index > cursor) {
      tokens.push(value.slice(cursor, match.index));
    }

    const tokenValue = match[0];
    if (tokenValue.startsWith('**') && tokenValue.endsWith('**')) {
      tokens.push(<strong key={`${match.index}-bold`}>{tokenValue.slice(2, -2)}</strong>);
    } else if (tokenValue.startsWith('*') && tokenValue.endsWith('*')) {
      tokens.push(<em key={`${match.index}-italic`}>{tokenValue.slice(1, -1)}</em>);
    } else {
      tokens.push(tokenValue);
    }

    cursor = match.index + tokenValue.length;
    match = pattern.exec(value);
  }

  if (cursor < value.length) {
    tokens.push(value.slice(cursor));
  }

  return tokens;
};

export const renderIdeaMarkdown = (value: string): ReactNode => {
  const lines = value.split(/\r?\n/);
  const blocks: ReactNode[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index] ?? '';
    const trimmed = line.trim();

    if (!trimmed) {
      index += 1;
      continue;
    }

    if (trimmed.startsWith('- ')) {
      const items: ReactNode[] = [];
      while (index < lines.length) {
        const listLine = (lines[index] ?? '').trim();
        if (!listLine.startsWith('- ')) {
          break;
        }

        items.push(<li key={`li-${index}`}>{renderInlineMarkdown(listLine.slice(2))}</li>);
        index += 1;
      }

      blocks.push(<ul key={`ul-${index}`} className="list-disc space-y-1 pl-5">{items}</ul>);
      continue;
    }

    blocks.push(
      <p key={`p-${index}`} className="whitespace-pre-wrap">
        {renderInlineMarkdown(trimmed)}
      </p>,
    );
    index += 1;
  }

  return blocks.map((block, blockIndex) => (
    <Fragment key={`block-${blockIndex}`}>
      {block}
    </Fragment>
  ));
};

const appendWithSeparator = (value: string, token: string): string => {
  if (!value.trim()) {
    return token;
  }

  if (value.endsWith('\n')) {
    return `${value}${token}`;
  }

  return `${value}\n${token}`;
};

export const appendBoldToken = (value: string): string => appendWithSeparator(value, '**bold text**');

export const appendItalicToken = (value: string): string => appendWithSeparator(value, '*italic text*');

export const appendBulletToken = (value: string): string => appendWithSeparator(value, '- list item');
