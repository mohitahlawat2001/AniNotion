import React, { useRef, useEffect, useState } from 'react';
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Link as LinkIcon,
  Quote,
  Code,
  Heading2,
  Minus,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Undo,
  Redo,
  Type
} from 'lucide-react';

const RichTextEditor = ({ value = '', onChange, placeholder = 'Write your content...', minHeight = '200px' }) => {
  const editorRef = useRef(null);
  const [isFocused, setIsFocused] = useState(false);
  const lastHtmlRef = useRef('');
  const isUpdatingRef = useRef(false);

  // Initialize editor content only when not focused
  useEffect(() => {
    if (editorRef.current && value !== lastHtmlRef.current && !isFocused && !isUpdatingRef.current) {
      editorRef.current.innerHTML = value || '';
      lastHtmlRef.current = value;
      // Ensure left-to-right direction
      editorRef.current.style.direction = 'ltr';
      editorRef.current.style.textAlign = 'left';
    }
  }, [value, isFocused]);

  const handleInput = () => {
    if (editorRef.current) {
      isUpdatingRef.current = true;
      const html = editorRef.current.innerHTML;
      lastHtmlRef.current = html;
      onChange(html);
      setTimeout(() => {
        isUpdatingRef.current = false;
      }, 100);
    }
  };

  const execCommand = (command, value = null) => {
    // Ensure editor has focus
    if (editorRef.current) {
      editorRef.current.focus();
    }
    
    // Check if command is supported
    if (!document.queryCommandSupported(command)) {
      console.warn(`Command ${command} is not supported`);
      return;
    }
    
    // Execute command
    try {
      const success = document.execCommand(command, false, value);
      console.log(`Command ${command} executed:`, success);
      
      // Update content after command
      setTimeout(() => {
        handleInput();
      }, 10);
    } catch (error) {
      console.error('Error executing command:', command, error);
    }
  };

  const insertLink = () => {
    const url = prompt('Enter URL:');
    if (url) {
      execCommand('createLink', url);
    }
  };

  const formatBlock = (tag) => {
    execCommand('formatBlock', tag);
  };

  // eslint-disable-next-line no-unused-vars
  const ToolbarButton = ({ onClick, icon: Icon, title, active = false }) => (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('Button clicked:', title);
        onClick();
      }}
      onMouseDown={(e) => {
        e.preventDefault(); // Prevent losing focus from editor
        console.log('Button mousedown:', title);
      }}
      onTouchStart={(e) => {
        e.preventDefault(); // Prevent scrolling on touch
        console.log('Button touch start:', title);
      }}
      title={title}
      className={`p-2 rounded hover:bg-gray-200 transition-colors touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center ${
        active ? 'bg-blue-100 text-blue-600' : 'text-gray-700'
      }`}
      aria-label={title}
    >
      <Icon size={18} />
    </button>
  );

  const Divider = () => <div className="w-px h-6 bg-gray-300 mx-1" />;

  return (
    <div
      className={`border rounded-lg overflow-hidden bg-white transition-all ${
        isFocused ? 'ring-2 ring-primary border-primary' : 'border-gray-300'
      }`}
    >
      {/* Toolbar */}
      <div className="border-b border-gray-200 p-2 bg-gray-50 flex flex-wrap gap-1 overflow-x-auto">
        {/* Text Formatting */}
        <ToolbarButton
          onClick={() => execCommand('bold')}
          icon={Bold}
          title="Bold (Ctrl+B)"
        />
        <ToolbarButton
          onClick={() => execCommand('italic')}
          icon={Italic}
          title="Italic (Ctrl+I)"
        />
        <ToolbarButton
          onClick={() => execCommand('underline')}
          icon={Underline}
          title="Underline (Ctrl+U)"
        />
        <ToolbarButton
          onClick={() => execCommand('strikeThrough')}
          icon={Minus}
          title="Strikethrough"
        />

        <Divider />

        {/* Headings & Format */}
        <ToolbarButton
          onClick={() => formatBlock('h2')}
          icon={Heading2}
          title="Heading 2"
        />
        <ToolbarButton
          onClick={() => formatBlock('p')}
          icon={Type}
          title="Normal Text"
        />

        <Divider />

        {/* Lists */}
        <ToolbarButton
          onClick={() => execCommand('insertUnorderedList')}
          icon={List}
          title="Bullet List"
        />
        <ToolbarButton
          onClick={() => execCommand('insertOrderedList')}
          icon={ListOrdered}
          title="Numbered List"
        />

        <Divider />

        {/* Alignment */}
        <ToolbarButton
          onClick={() => execCommand('justifyLeft')}
          icon={AlignLeft}
          title="Align Left"
        />
        <ToolbarButton
          onClick={() => execCommand('justifyCenter')}
          icon={AlignCenter}
          title="Align Center"
        />
        <ToolbarButton
          onClick={() => execCommand('justifyRight')}
          icon={AlignRight}
          title="Align Right"
        />

        <Divider />

        {/* Insert */}
        <ToolbarButton
          onClick={insertLink}
          icon={LinkIcon}
          title="Insert Link"
        />
        <ToolbarButton
          onClick={() => formatBlock('blockquote')}
          icon={Quote}
          title="Quote"
        />
        <ToolbarButton
          onClick={() => execCommand('formatBlock', '<pre>')}
          icon={Code}
          title="Code Block"
        />

        <Divider />

        {/* Undo/Redo */}
        <ToolbarButton
          onClick={() => execCommand('undo')}
          icon={Undo}
          title="Undo (Ctrl+Z)"
        />
        <ToolbarButton
          onClick={() => execCommand('redo')}
          icon={Redo}
          title="Redo (Ctrl+Y)"
        />
      </div>

      {/* Editor Area */}
      <div
        ref={editorRef}
        contentEditable="true"
        dir="ltr"
        onInput={handleInput}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className="p-4 outline-none overflow-y-auto prose prose-sm max-w-none text-left relative min-h-[120px] sm:min-h-[200px]"
        style={{ minHeight, textAlign: 'left', direction: 'ltr' }}
        data-placeholder={placeholder}
        suppressContentEditableWarning={true}
      />

      <style>{`
        [contentEditable] {
          direction: ltr;
          text-align: left;
          position: relative;
          -webkit-user-select: text;
          -webkit-touch-callout: default;
          -webkit-tap-highlight-color: transparent;
        }

        [contentEditable]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
          position: absolute;
          top: 1rem;
          left: 1rem;
          text-align: left;
          direction: ltr;
        }

        /* Mobile-specific improvements */
        @media (max-width: 640px) {
          [contentEditable] {
            font-size: 16px; /* Prevent zoom on iOS */
            line-height: 1.6;
          }
          
          .prose h2 {
            font-size: 1.25em;
            margin-top: 0.75em;
            margin-bottom: 0.375em;
          }
          
          .prose p {
            margin-bottom: 0.75em;
          }
        }

        /* Styling for the rich text content */
        .prose h2 {
          font-size: 1.5em;
          font-weight: 700;
          margin-top: 1em;
          margin-bottom: 0.5em;
          line-height: 1.3;
          text-align: left;
          direction: ltr;
        }

        .prose p {
          margin-bottom: 1em;
          line-height: 1.7;
          text-align: left;
          direction: ltr;
        }

        .prose ul, .prose ol {
          margin-left: 1.5em;
          margin-bottom: 1em;
        }

        .prose ul {
          list-style-type: disc;
        }

        .prose ol {
          list-style-type: decimal;
        }

        .prose li {
          margin-bottom: 0.5em;
        }

        .prose a {
          color: #2563eb;
          text-decoration: underline;
        }

        .prose a:hover {
          color: #1d4ed8;
        }

        .prose blockquote {
          border-left: 4px solid #e5e7eb;
          padding-left: 1em;
          margin-left: 0;
          margin-right: 0;
          color: #6b7280;
          font-style: italic;
        }

        .prose pre {
          background: #f3f4f6;
          padding: 1em;
          border-radius: 0.375rem;
          overflow-x: auto;
          font-family: 'Courier New', monospace;
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
        }

        .prose em {
          font-style: italic;
        }

        .prose u {
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
};

export default RichTextEditor;
