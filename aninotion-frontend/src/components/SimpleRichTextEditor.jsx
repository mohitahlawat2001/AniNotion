import React, { useRef, useState } from 'react';
import { Bold, Italic, Underline, List } from 'lucide-react';

/**
 * Simple Rich Text Editor for testing
 */
const SimpleRichTextEditor = ({ value = '', onChange }) => {
  const editorRef = useRef(null);
  const [focused, setFocused] = useState(false);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const format = (cmd, val = null) => {
    document.execCommand(cmd, false, val);
    editorRef.current?.focus();
  };

  return (
    <div className="border rounded-lg">
      {/* Simple Toolbar */}
      <div className="border-b p-2 bg-gray-50 flex gap-2">
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => format('bold')}
          className="px-3 py-1 bg-white border rounded hover:bg-gray-100"
          title="Bold"
        >
          <Bold size={16} />
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => format('italic')}
          className="px-3 py-1 bg-white border rounded hover:bg-gray-100"
          title="Italic"
        >
          <Italic size={16} />
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => format('underline')}
          className="px-3 py-1 bg-white border rounded hover:bg-gray-100"
          title="Underline"
        >
          <Underline size={16} />
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => format('insertUnorderedList')}
          className="px-3 py-1 bg-white border rounded hover:bg-gray-100"
          title="Bullet List"
        >
          <List size={16} />
        </button>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable={true}
        onInput={handleInput}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        dangerouslySetInnerHTML={{ __html: value }}
        className={`p-4 min-h-[200px] outline-none ${focused ? 'bg-white' : 'bg-gray-50'}`}
        style={{ direction: 'ltr', textAlign: 'left' }}
      />
    </div>
  );
};

export default SimpleRichTextEditor;
