import React, { useCallback, useState } from 'react';
import type { Editor } from '@tiptap/react';

interface ToolbarProps {
  editor: Editor;
  onSetLink: () => void;
  onAddImage: () => void;
  onAddEmbed: (type: 'youtube' | 'twitter' | 'gist' | 'codepen') => void;
}

const FONT_FAMILIES = [
  'Inter',
  'Arial',
  'Helvetica',
  'Georgia',
  'Times New Roman',
  'Courier New',
  'monospace',
];

const FONT_SIZES = [12, 14, 16, 18, 20, 24, 28, 32, 36, 42, 48, 56, 64, 72];

const Toolbar: React.FC<ToolbarProps> = ({ editor, onSetLink, onAddImage, onAddEmbed }) => {
  const [showEmbedMenu, setShowEmbedMenu] = useState(false);

  const addImageFromFile = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const url = ev.target?.result as string;
          if (url) editor.chain().focus().setImage({ src: url }).run();
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  }, [editor]);

  const ToolbarButton: React.FC<{
    onClick: () => void;
    isActive?: boolean;
    title: string;
    children: React.ReactNode;
  }> = ({ onClick, isActive, title, children }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`px-2 py-1.5 text-xs rounded transition-colors ${
        isActive ? 'bg-white/15 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'
      }`}
    >
      {children}
    </button>
  );

  const ToolbarDivider = () => <span className="w-px h-5 bg-white/10 mx-0.5" />;

  return (
    <div className="flex flex-wrap items-center gap-0.5 px-3 py-2 border-b border-white/10 bg-black/60 sticky top-0 z-10">
      {/* Text formatting */}
      <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')} title="Bold (Ctrl+B)">
        <strong>B</strong>
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')} title="Italic (Ctrl+I)">
        <em>I</em>
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} isActive={editor.isActive('underline')} title="Underline">
        <span className="underline">U</span>
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} isActive={editor.isActive('strike')} title="Strikethrough">
        <span className="line-through">S</span>
      </ToolbarButton>

      <ToolbarDivider />

      {/* Headings */}
      <select
        onChange={(e) => {
          const val = e.target.value;
          if (val === 'p') editor.chain().focus().setParagraph().run();
          else if (val.startsWith('h')) editor.chain().focus().toggleHeading({ level: parseInt(val[1]) as 1|2|3|4|5|6 }).run();
          e.target.value = '';
        }}
        className="bg-transparent text-gray-400 text-xs border border-white/10 rounded px-1.5 py-1 hover:text-white cursor-pointer"
        title="Heading"
      >
        <option value="">H</option>
        <option value="p">Paragraph</option>
        <option value="h1">H1</option>
        <option value="h2">H2</option>
        <option value="h3">H3</option>
        <option value="h4">H4</option>
        <option value="h5">H5</option>
        <option value="h6">H6</option>
      </select>

      <ToolbarDivider />

      {/* Font size */}
      <select
        onChange={(e) => {
          const val = parseInt(e.target.value);
          if (val) editor.chain().focus().setFontSize(`${val}px`).run();
          e.target.value = '';
        }}
        className="bg-transparent text-gray-400 text-xs border border-white/10 rounded px-1.5 py-1 hover:text-white cursor-pointer w-14"
        title="Font Size"
      >
        <option value="">Size</option>
        {FONT_SIZES.map((s) => (
          <option key={s} value={s}>{s}px</option>
        ))}
      </select>

      {/* Font family */}
      <select
        onChange={(e) => {
          const val = e.target.value;
          if (val) editor.chain().focus().setFontFamily(val).run();
          e.target.value = '';
        }}
        className="bg-transparent text-gray-400 text-xs border border-white/10 rounded px-1.5 py-1 hover:text-white cursor-pointer max-w-[90px]"
        title="Font Family"
      >
        <option value="">Font</option>
        {FONT_FAMILIES.map((f) => (
          <option key={f} value={f}>{f}</option>
        ))}
      </select>

      <ToolbarDivider />

      {/* Text color */}
      <input
        type="color"
        onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
        title="Text Color"
        className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
      />

      {/* Highlight color */}
      <input
        type="color"
        onChange={(e) => editor.chain().focus().toggleHighlight({ color: e.target.value }).run()}
        title="Highlight Color"
        className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
      />

      <ToolbarDivider />

      {/* Alignment */}
      <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('left').run()} isActive={editor.isActive({ textAlign: 'left' })} title="Align Left">
        ≡
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('center').run()} isActive={editor.isActive({ textAlign: 'center' })} title="Align Center">
        ≡
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('right').run()} isActive={editor.isActive({ textAlign: 'right' })} title="Align Right">
        ≡
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('justify').run()} isActive={editor.isActive({ textAlign: 'justify' })} title="Justify">
        ≡
      </ToolbarButton>

      <ToolbarDivider />

      {/* Lists */}
      <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive('bulletList')} title="Bullet List">
        •≡
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive('orderedList')} title="Ordered List">
        1.
      </ToolbarButton>

      <ToolbarDivider />

      {/* Block elements */}
      <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} isActive={editor.isActive('blockquote')} title="Blockquote">
        &ldquo;
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Horizontal Rule">
        —
      </ToolbarButton>

      {/* Code block */}
      <ToolbarButton onClick={() => editor.chain().focus().toggleCodeBlock().run()} isActive={editor.isActive('codeBlock')} title="Code Block">
        {'</>'}
      </ToolbarButton>

      <ToolbarDivider />

      {/* Links */}
      <ToolbarButton onClick={onSetLink} isActive={editor.isActive('link')} title="Link (Ctrl+K)">
        Link
      </ToolbarButton>

      {/* Image upload */}
      <ToolbarButton onClick={addImageFromFile} title="Upload Image">
        Img
      </ToolbarButton>
      <ToolbarButton onClick={onAddImage} title="Image URL">
        URL
      </ToolbarButton>

      <ToolbarDivider />

      {/* Embeds */}
      <div className="relative">
        <ToolbarButton onClick={() => setShowEmbedMenu(!showEmbedMenu)} title="Embed Media">
          Embed
        </ToolbarButton>
        {showEmbedMenu && (
          <div className="absolute top-full left-0 mt-1 bg-gray-900 border border-white/10 rounded-lg shadow-xl py-1 z-20 min-w-[140px]">
            <button onClick={() => { onAddEmbed('youtube'); setShowEmbedMenu(false); }} className="block w-full text-left px-3 py-1.5 text-xs text-gray-300 hover:text-white hover:bg-white/5">
              YouTube
            </button>
            <button onClick={() => { onAddEmbed('twitter'); setShowEmbedMenu(false); }} className="block w-full text-left px-3 py-1.5 text-xs text-gray-300 hover:text-white hover:bg-white/5">
              X / Twitter
            </button>
            <button onClick={() => { onAddEmbed('gist'); setShowEmbedMenu(false); }} className="block w-full text-left px-3 py-1.5 text-xs text-gray-300 hover:text-white hover:bg-white/5">
              GitHub Gist
            </button>
            <button onClick={() => { onAddEmbed('codepen'); setShowEmbedMenu(false); }} className="block w-full text-left px-3 py-1.5 text-xs text-gray-300 hover:text-white hover:bg-white/5">
              CodePen
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Toolbar;
