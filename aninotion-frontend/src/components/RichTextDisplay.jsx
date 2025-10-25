import React from 'react';

/**
 * Component to safely display rich HTML content from the editor
 * This component applies the same styling as the editor for consistency
 */
const RichTextDisplay = ({ content, className = '' }) => {
  if (!content) return null;

  return (
    <>
      <style>{`
        /* Styling for the rich text content - matches the editor */
        .prose {
          direction: ltr;
          text-align: left;
        }

        .prose h2 {
          font-size: 1.5em;
          font-weight: 700;
          margin-top: 1em;
          margin-bottom: 0.5em;
          line-height: 1.3;
          color: #111827;
          text-align: left;
          direction: ltr;
        }

        .prose p {
          margin-bottom: 1em;
          line-height: 1.7;
          color: #374151;
          text-align: left;
          direction: ltr;
        }

        .prose ul, .prose ol {
          margin-left: 1.5em;
          margin-bottom: 1em;
          text-align: left;
          direction: ltr;
        }

        .prose ul {
          list-style-type: disc;
        }

        .prose ol {
          list-style-type: decimal;
        }

        .prose li {
          margin-bottom: 0.5em;
          line-height: 1.6;
          text-align: left;
          direction: ltr;
        }

        .prose a {
          color: #2563eb;
          text-decoration: underline;
          direction: ltr;
        }

        .prose a:hover {
          color: #1d4ed8;
        }

        .prose blockquote {
          border-left: 4px solid #e5e7eb;
          padding-left: 1em;
          margin-left: 0;
          margin-right: 0;
          margin-bottom: 1em;
          color: #6b7280;
          font-style: italic;
        }

        .prose pre {
          background: #f3f4f6;
          padding: 1em;
          border-radius: 0.375rem;
          overflow-x: auto;
          font-family: 'Courier New', monospace;
          margin-bottom: 1em;
        }

        .prose code {
          background: #f3f4f6;
          padding: 0.2em 0.4em;
          border-radius: 0.25rem;
          font-family: 'Courier New', monospace;
          font-size: 0.875em;
        }

        .prose strong {
          font-weight: 700;
          color: #111827;
        }

        .prose em {
          font-style: italic;
        }

        .prose u {
          text-decoration: underline;
        }

        /* Make images responsive */
        .prose img {
          max-width: 100%;
          height: auto;
          border-radius: 0.5rem;
          margin: 1em 0;
        }

        /* Remove default margins on first/last children */
        .prose > *:first-child {
          margin-top: 0;
        }

        .prose > *:last-child {
          margin-bottom: 0;
        }
      `}</style>
      
      <div 
        className={`prose prose-sm max-w-none ${className}`}
        dir="ltr"
        style={{ direction: 'ltr', textAlign: 'left' }}
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </>
  );
};

export default RichTextDisplay;
