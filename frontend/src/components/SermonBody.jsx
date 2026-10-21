import { parseSermonBody } from "../lib/sermons";

/**
 * Renders sermon text with golden ratio typography: line height φ (1.618),
 * section headings one step up the scale (1.618rem), and spacing of 1rem
 * between paragraphs and φ² (2.618rem) above each heading.
 */
export default function SermonBody({ text }) {
  const blocks = parseSermonBody(text);

  return (
    <div className="font-nunito text-gr-base leading-[1.618] text-gray-700 md:text-[1.125rem]">
      {blocks.map((block, index) => {
        if (block.type === "heading") {
          return (
            <h2
              key={index}
              className="mb-4 mt-[2.618rem] font-palatino text-gr-lg font-bold leading-tight text-[#330040] first:mt-0"
            >
              {block.text}
            </h2>
          );
        }
        if (block.type === "quote") {
          return (
            <blockquote
              key={index}
              className="my-[1.618rem] whitespace-pre-line rounded-r-2xl border-l-4 border-[#ffd700] bg-[#f6eefa] px-[1.618rem] py-4 font-palatino text-gr-md italic leading-[1.618] text-[#330040] first:mt-0"
            >
              {block.text}
            </blockquote>
          );
        }
        return (
          <p key={index} className="mb-4 whitespace-pre-line last:mb-0">
            {block.text}
          </p>
        );
      })}
    </div>
  );
}
