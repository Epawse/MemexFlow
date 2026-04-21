import i18n from "../../i18n/config";

interface Citation {
  memory_id: string;
  relevance: string | null;
}

interface CitedMemory {
  id: string;
  summary: string;
  content: string;
}

/**
 * Render brief content with [Mn] citation markers as clickable spans.
 * Also handles markdown-ish: headers, bullets, line breaks.
 */
export function renderContent(
  content: string,
  citations: Citation[] | null,
  citedMemories: Map<string, CitedMemory>,
) {
  if (!content) return null;

  const parts = content.split(/(\[M\d+\])/g);
  return parts.map((part, i) => {
    const match = part.match(/^\[M(\d+)\]$/);
    if (match) {
      const idx = parseInt(match[1], 10) - 1;
      const citation = (citations ?? [])[idx];
      const memory = citation ? citedMemories.get(citation.memory_id) : null;
      return (
        <span
          key={i}
          className="text-primary-600 dark:text-primary-400 font-medium cursor-help"
          title={memory?.summary || i18n.t("common.citedMemory")}
        >
          {part}
        </span>
      );
    }
    const lines = part.split("\n");
    return lines.map((line, j) => {
      if (line.startsWith("### "))
        return <h4 key={`${i}-${j}`} className="text-base font-semibold text-gray-900 dark:text-white mt-4 mb-2">{line.slice(4)}</h4>;
      if (line.startsWith("## "))
        return <h3 key={`${i}-${j}`} className="text-lg font-semibold text-gray-900 dark:text-white mt-5 mb-2">{line.slice(3)}</h3>;
      if (line.startsWith("# "))
        return <h2 key={`${i}-${j}`} className="text-xl font-bold text-gray-900 dark:text-white mt-6 mb-3">{line.slice(2)}</h2>;
      if (line.startsWith("- ") || line.startsWith("* "))
        return <li key={`${i}-${j}`} className="text-sm text-gray-700 dark:text-gray-300 ml-4">{line.slice(2)}</li>;
      if (line.trim() === "")
        return <br key={`${i}-${j}`} />;
      return <p key={`${i}-${j}`} className="text-sm text-gray-700 dark:text-gray-300">{line}</p>;
    });
  });
}