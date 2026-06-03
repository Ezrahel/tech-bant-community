import React, { useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import TextAlign from '@tiptap/extension-text-align';
import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import FontFamily from '@tiptap/extension-font-family';
import { TextStyle } from '@tiptap/extension-text-style';
import Placeholder from '@tiptap/extension-placeholder';
import { common, createLowlight } from 'lowlight';
import { FontSize } from './FontSizeExtension';
import Toolbar from './Toolbar';

const lowlight = createLowlight(common);

interface TipTapEditorProps {
  content: string;
  onChange: (html: string, json: Record<string, unknown>) => void;
  placeholder?: string;
  editable?: boolean;
  editorRef?: React.MutableRefObject<ReturnType<typeof useEditor> | null>;
}

const TipTapEditor: React.FC<TipTapEditorProps> = ({
  content,
  onChange,
  placeholder = 'Start writing...',
  editable = true,
  editorRef,
}) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
        heading: { levels: [1, 2, 3, 4, 5, 6] },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' },
      }),
      Image.configure({ inline: false, allowBase64: false }),
      CodeBlockLowlight.configure({ lowlight }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      FontFamily,
      FontSize,
      Placeholder.configure({ placeholder }),
    ],
    content,
    editable,
    onUpdate: ({ editor: ed }) => {
      const html = ed.getHTML();
      const json = ed.getJSON();
      onChange(html, json as Record<string, unknown>);
    },
    editorProps: {
      attributes: {
        class:
          'prose prose-invert max-w-none focus:outline-none min-h-[500px] px-6 py-4 text-white/90 text-sm leading-7',
      },
      handleDrop: (view, event) => {
        const files = event.dataTransfer?.files;
        if (files && files.length > 0) {
          event.preventDefault();
          const file = files[0];
          if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
              const url = e.target?.result as string;
              if (url) {
                editor?.chain().focus().setImage({ src: url }).run();
              }
            };
            reader.readAsDataURL(file);
          }
          return true;
        }
        return false;
      },
    },
  });

  if (editorRef) {
    editorRef.current = editor;
  }

  const setLink = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl || 'https://');
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  const addImage = useCallback(() => {
    const url = window.prompt('Image URL');
    if (url) {
      editor?.chain().focus().setImage({ src: url }).run();
    }
  }, [editor]);

  const addEmbed = useCallback((type: 'youtube' | 'twitter' | 'gist' | 'codepen') => {
    const url = window.prompt(`Enter ${type} URL:`);
    if (!url || !editor) return;

    let embedHtml = '';
    switch (type) {
      case 'youtube': {
        const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
        if (match) {
          embedHtml = `<div class="embed-youtube" style="position:relative;padding-bottom:56.25%;height:0;margin:1.5rem 0">
            <iframe src="https://www.youtube.com/embed/${match[1]}" style="position:absolute;top:0;left:0;width:100%;height:100%" frameborder="0" allowfullscreen></iframe>
          </div>`;
        }
        break;
      }
      case 'twitter': {
        embedHtml = `<div class="embed-twitter" style="margin:1.5rem 0;padding:1rem;border:1px solid #333;border-radius:8px;background:#1a1a1a">
          <p style="color:#888;font-size:12px">X/Tweet embed — <a href="${url}" target="_blank" rel="noopener" style="color:#3b82f6">View on X</a></p>
        </div>`;
        break;
      }
      case 'gist': {
        const gistMatch = url.match(/gist\.github\.com\/[\w-]+\/([\w]+)/);
        if (gistMatch) {
          embedHtml = `<div class="embed-gist" style="margin:1.5rem 0">
            <script src="${url}.js"></script>
          </div>`;
        }
        break;
      }
      case 'codepen': {
        const penMatch = url.match(/codepen\.io\/([\w-]+)\/pen\/([\w-]+)/);
        if (penMatch) {
          embedHtml = `<div class="embed-codepen" style="position:relative;padding-bottom:56.25%;height:0;margin:1.5rem 0">
            <iframe src="https://codepen.io/${penMatch[1]}/embed/${penMatch[2]}" style="position:absolute;top:0;left:0;width:100%;height:100%" frameborder="0" allowfullscreen></iframe>
          </div>`;
        }
        break;
      }
    }

    if (embedHtml) {
      editor.chain().focus().insertContent(embedHtml).run();
    }
  }, [editor]);

  if (!editor) return null;

  return (
    <div className="border border-white/10 rounded-xl overflow-hidden bg-black/40">
      <Toolbar editor={editor} onSetLink={setLink} onAddImage={addImage} onAddEmbed={addEmbed} />
      <BubbleMenu editor={editor} tippyOptions={{ duration: 100 }}>
        <div className="flex items-center gap-0.5 bg-gray-900 rounded-lg border border-white/10 shadow-xl px-1 py-1">
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-1.5 rounded text-xs font-bold ${editor.isActive('bold') ? 'bg-white/20 text-white' : 'text-gray-400 hover:text-white'}`}
          >
            B
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-1.5 rounded text-xs italic ${editor.isActive('italic') ? 'bg-white/20 text-white' : 'text-gray-400 hover:text-white'}`}
          >
            I
          </button>
          <button
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`p-1.5 rounded text-xs underline ${editor.isActive('underline') ? 'bg-white/20 text-white' : 'text-gray-400 hover:text-white'}`}
          >
            U
          </button>
          <button
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={`p-1.5 rounded text-xs line-through ${editor.isActive('strike') ? 'bg-white/20 text-white' : 'text-gray-400 hover:text-white'}`}
          >
            S
          </button>
          <span className="w-px h-5 bg-white/10 mx-1" />
          <button
            onClick={setLink}
            className={`p-1.5 rounded text-xs ${editor.isActive('link') ? 'bg-white/20 text-white' : 'text-gray-400 hover:text-white'}`}
          >
            Link
          </button>
        </div>
      </BubbleMenu>
      <EditorContent editor={editor} />
    </div>
  );
};

export default TipTapEditor;
