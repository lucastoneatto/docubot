function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => {
    return (
      { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[
        c as '&' | '<' | '>' | '"' | "'"
      ]
    );
  });
}

function renderInline(text: string): string {
  let value = text.replace(/^([ \t]*)- (?=\S)/gm, '$1• ');
  let out = '';
  let i = 0;

  while (i < value.length) {
    const rest = value.slice(i);
    let match: RegExpExecArray | null;

    if ((match = /^\*\*([^*\n]+)\*\*/.exec(rest))) {
      out += `<strong>${renderInline(match[1])}</strong>`;
      i += match[0].length;
    } else if ((match = /^\*([^*\n]+)\*/.exec(rest))) {
      out += `<em>${renderInline(match[1])}</em>`;
      i += match[0].length;
    } else if ((match = /^https?:\/\/[^\s<]+/.exec(rest))) {
      const url = match[0].replace(/[.,;:!?)\]]+$/, '');
      out += `<a href="${escapeHtml(url)}" target="_blank" rel="noopener">${escapeHtml(url)}</a>`;
      i += match[0].length;
    } else {
      const next = rest.search(/[*]|https?:\/\//);
      const end = next === -1 ? rest.length : next;
      out += escapeHtml(rest.slice(0, end));
      i += end;
    }
  }

  return out;
}

/**
 * Renders assistant message text (bold/italic + bare URLs). There is no
 * source-linking here anymore: uploaded documents have no public URL, so
 * sources are rendered separately as filename tags by the caller (see
 * ChatPlayground and widget.js's addSources()).
 */
export function renderMessage(text: string): string {
  return renderInline(text);
}
