import React from "react";

/**
 * Retorna um ReactNode com a parte correspondente ao `query` destacada em negrito.
 * A busca é case-insensitive. Se não houver match, retorna o texto original.
 */
export function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query || !query.trim()) return text;

  const trimmed = query.trim();
  const lowerText = text.toLowerCase();
  const lowerQuery = trimmed.toLowerCase();
  const index = lowerText.indexOf(lowerQuery);

  if (index === -1) return text;

  const before = text.slice(0, index);
  const match = text.slice(index, index + trimmed.length);
  const after = text.slice(index + trimmed.length);

  return (
    <>
      {before}
      <mark className="bg-yellow-200 dark:bg-yellow-700 text-inherit rounded-sm px-0">{match}</mark>
      {after}
    </>
  );
}
