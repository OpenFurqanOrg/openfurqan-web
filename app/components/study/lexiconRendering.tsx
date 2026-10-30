import type { ReactNode } from "react";

export const LANE_ABBREVIATION_GUIDE = [
  { code: "S", meaning: "as-Sihah (al-Jawhari)" },
  { code: "Msb", meaning: "al-Misbah al-Munir" },
  { code: "K", meaning: "al-Qamus al-Muhit" },
  { code: "*", meaning: "editorial emphasis marker in the source text" }
] as const;

export const parseReference = (value: string) => {
  const match = String(value || "").trim().match(/^(\d{1,3})\s*:\s*(\d{1,3})$/);
  if (!match) return null;
  const surah = Number(match[1]);
  const ayah = Number(match[2]);
  if (!Number.isInteger(surah) || !Number.isInteger(ayah)) return null;
  if (surah < 1 || surah > 114 || ayah < 1) return null;
  return { surah, ayah };
};

export const stripMarkup = (value: string) =>
  String(value || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export const renderHighlightedAyah = (value?: string) => {
  const source = String(value || "").trim();
  if (!source) return null;
  const regex = /<a[^>]*class=(["'])highlight-text\1[^>]*>(.*?)<\/a>/gi;
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let index = 0;

  while ((match = regex.exec(source))) {
    const before = stripMarkup(source.slice(lastIndex, match.index));
    if (before) {
      nodes.push(<span key={`plain-${index}`}>{before} </span>);
      index += 1;
    }

    const highlighted = stripMarkup(match[2] || "");
    if (highlighted) {
      nodes.push(
        <span key={`mark-${index}`} className="study-root-ayah-highlight">
          {highlighted}
        </span>
      );
      nodes.push(<span key={`space-${index}`}> </span>);
      index += 1;
    }
    lastIndex = match.index + match[0].length;
  }

  const after = stripMarkup(source.slice(lastIndex));
  if (after) {
    nodes.push(<span key={`tail-${index}`}>{after}</span>);
  }

  return nodes.length ? nodes : stripMarkup(source);
};

export const stripRootCountParagraph = (html?: string | null) => {
  const content = String(html || "").trim();
  if (!content) return "";

  return content
    .replace(/(?:<br\s*\/?>\s*){2}Of this root,[\s\S]*$/i, "")
    .trim();
};

export const normalizeLexHtml = (html?: string | null) =>
  String(html || "")
    .replace(/<br\s*\/?>\s*;/gi, "; ")
    .trim();

export const LexHtmlBlock = ({ html }: { html?: string | null }) => {
  const content = normalizeLexHtml(html);
  if (!content) return null;
  return <div className="study-root-lex-html" dangerouslySetInnerHTML={{ __html: content }} />;
};

