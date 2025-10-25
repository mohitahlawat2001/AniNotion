import React, { useState } from 'react';
import RichTextEditor from '../components/RichTextEditor';
import RichTextDisplay from '../components/RichTextDisplay';
import { Copy, Check } from 'lucide-react';

/**
 * Demo page showcasing the Rich Text Editor features
 * This can be used for testing and documentation purposes
 */
const RichTextEditorDemo = () => {
  const [content, setContent] = useState(`
    <h2>Welcome to the Rich Text Editor!</h2>
    <p>This is a <strong>powerful</strong> and <em>easy-to-use</em> rich text editor for AniNotion.</p>
    
    <h2>Features Include:</h2>
    <ul>
      <li><strong>Bold text</strong> for emphasis</li>
      <li><em>Italic text</em> for style</li>
      <li><u>Underlined text</u> for highlighting</li>
      <li>And much more!</li>
    </ul>
    
    <h2>Perfect for Anime Reviews</h2>
    <p>Share your thoughts about your favorite anime with beautifully formatted text!</p>
    
    <blockquote>
      "This editor makes writing reviews so much easier!" - Happy User
    </blockquote>
    
    <p>Try it out by clicking in the editor below!</p>
  `);

  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Rich Text Editor Demo
          </h1>
          <p className="text-gray-600">
            Try out the formatting features below!
          </p>
        </div>

        {/* Demo Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Editor Section */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Editor</h2>
            <p className="text-sm text-gray-600 mb-4">
              Edit the content below to see real-time changes
            </p>
            <RichTextEditor
              value={content}
              onChange={setContent}
              placeholder="Start typing your content here..."
              minHeight="400px"
            />
          </div>

          {/* Preview Section */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Preview</h2>
            <p className="text-sm text-gray-600 mb-4">
              This is how your content will appear
            </p>
            <div className="border border-gray-200 rounded-lg p-4 min-h-[400px] bg-gray-50">
              <RichTextDisplay content={content} />
            </div>
          </div>
        </div>

        {/* HTML Output */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-800">HTML Output</h2>
            <button
              onClick={handleCopy}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {copied ? (
                <>
                  <Check size={16} />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy size={16} />
                  <span>Copy HTML</span>
                </>
              )}
            </button>
          </div>
          <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm">
            {content}
          </pre>
        </div>

        {/* Features List */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">Available Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold text-lg mb-2 text-gray-700">Text Formatting</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Bold (Ctrl+B)</li>
                <li>• Italic (Ctrl+I)</li>
                <li>• Underline (Ctrl+U)</li>
                <li>• Strikethrough</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2 text-gray-700">Structure</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Headings (H2)</li>
                <li>• Bullet Lists</li>
                <li>• Numbered Lists</li>
                <li>• Blockquotes</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2 text-gray-700">Alignment</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Align Left</li>
                <li>• Align Center</li>
                <li>• Align Right</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2 text-gray-700">Other</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Insert Links</li>
                <li>• Code Blocks</li>
                <li>• Undo/Redo</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Tips */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-lg mb-3 text-blue-900">💡 Pro Tips</h3>
          <ul className="space-y-2 text-blue-800 text-sm">
            <li>• Use <strong>Ctrl+B</strong>, <strong>Ctrl+I</strong>, and <strong>Ctrl+U</strong> for quick formatting</li>
            <li>• Select text before clicking formatting buttons</li>
            <li>• Use headings to organize longer posts</li>
            <li>• Add links to reference external sources</li>
            <li>• Use lists to make content more readable</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default RichTextEditorDemo;
