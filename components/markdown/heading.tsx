"use client"
import React from 'react';
import { MarkdownProcessor } from '@/lib/markdown-processor';

interface HeadingProps {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  content: string;
}

/**
 * Component for rendering markdown headings
 */
const Heading: React.FC<HeadingProps> = ({ level, content }) => {
  const headingColors = [
    "text-indigo-700", // h1
    "text-blue-700",   // h2
    "text-cyan-700",   // h3
    "text-teal-700",   // h4
    "text-green-700",  // h5
    "text-emerald-700" // h6
  ];
  
  const sizes = [
    "text-2xl font-bold my-4",
    "text-xl font-bold my-3",
    "text-lg font-bold my-2",
    "text-base font-bold my-2",
    "text-sm font-bold my-1",
    "text-xs font-bold my-1"
  ];
  
  const slug = MarkdownProcessor.slugify(content);
  const processedContent = MarkdownProcessor.processInlineMarkdown(content);
  
  const HeadingTag = `h${level}` as keyof JSX.IntrinsicElements;
  
  return (
    <HeadingTag 
      id={slug}
      className={`${sizes[level-1]} ${headingColors[level-1]}`}
      dangerouslySetInnerHTML={{ __html: processedContent }}
    />
  );
};

export default Heading;
