"use client";

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Bold, Italic, List, ListOrdered, Heading2, Quote, Clock } from 'lucide-react';
import { useEffect, useRef } from 'react';

// Custom Extension for # and ## comments
import { InputRule, markInputRule, Mark, mergeAttributes } from '@tiptap/core';

// Green Text Comment (# comment)
const InlineComment = Mark.create({
    name: 'inlineComment',
    addOptions() {
        return { HTMLAttributes: { class: 'text-green-500 italic' } }
    },
    parseHTML() { return [{ tag: 'span.inline-comment' }] },
    renderHTML({ HTMLAttributes }) {
        return ['span', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, { class: 'inline-comment text-green-500 italic' }), 0]
    },
    addInputRules() {
        return [
            markInputRule({
                find: /(?:^|\s)#\s([^#]+)#$/,
                type: this.type,
            }),
        ]
    },
});

// Bold Yellow Comment (## comment)
const BoldComment = Mark.create({
    name: 'boldComment',
    addOptions() {
        return { HTMLAttributes: { class: 'text-yellow-500 font-bold' } }
    },
    parseHTML() { return [{ tag: 'span.bold-comment' }] },
    renderHTML({ HTMLAttributes }) {
        return ['span', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, { class: 'bold-comment text-yellow-500 font-bold' }), 0]
    },
    addInputRules() {
        return [
            markInputRule({
                find: /(?:^|\s)##\s([^#]+)##$/,
                type: this.type,
            }),
        ]
    },
});

interface RichTextEditorProps {
    content: string;
    onChange: (content: string) => void;
    onCaptureTimestamp?: () => void;
    editorRef?: React.MutableRefObject<any>;
}

export function RichTextEditor({ content, onChange, onCaptureTimestamp, editorRef }: RichTextEditorProps) {
    const editor = useEditor({
        extensions: [
            StarterKit,
            InlineComment,
            BoldComment
        ],
        content,
        immediatelyRender: false,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: 'tiptap-editor focus:outline-none min-h-[300px] p-6 text-foreground prose prose-sm dark:prose-invert max-w-none',
            },
        },
    });

    useEffect(() => {
        if (editor && editorRef) {
            editorRef.current = editor;
        }
    }, [editor, editorRef]);

    // Handle external content updates (like loading a new note)
    useEffect(() => {
        if (editor && content !== editor.getHTML()) {
            editor.commands.setContent(content);
        }
    }, [content, editor]);

    if (!editor) {
        return null;
    }

    return (
        <div className="flex flex-col h-full bg-card border border-border rounded-2xl overflow-hidden focus-within:border-primary/50 transition-colors">
            <div className="flex items-center gap-1 p-2 border-b border-border bg-muted/50 flex-wrap">
                <button
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    className={`p-2 rounded hover:bg-accent ${editor.isActive('bold') ? 'bg-accent text-foreground' : 'text-muted-foreground'}`}
                    title="Bold"
                >
                    <Bold className="w-4 h-4" />
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    className={`p-2 rounded hover:bg-accent ${editor.isActive('italic') ? 'bg-accent text-foreground' : 'text-muted-foreground'}`}
                    title="Italic"
                >
                    <Italic className="w-4 h-4" />
                </button>
                <div className="w-px h-6 bg-border mx-1" />
                <button
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    className={`p-2 rounded hover:bg-accent ${editor.isActive('heading', { level: 2 }) ? 'bg-accent text-foreground' : 'text-muted-foreground'}`}
                    title="Heading 2"
                >
                    <Heading2 className="w-4 h-4" />
                </button>
                <div className="w-px h-6 bg-border mx-1" />
                <button
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    className={`p-2 rounded hover:bg-accent ${editor.isActive('bulletList') ? 'bg-accent text-foreground' : 'text-muted-foreground'}`}
                    title="Bullet List"
                >
                    <List className="w-4 h-4" />
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    className={`p-2 rounded hover:bg-accent ${editor.isActive('orderedList') ? 'bg-accent text-foreground' : 'text-muted-foreground'}`}
                    title="Ordered List"
                >
                    <ListOrdered className="w-4 h-4" />
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleBlockquote().run()}
                    className={`p-2 rounded hover:bg-accent ${editor.isActive('blockquote') ? 'bg-accent text-foreground' : 'text-muted-foreground'}`}
                    title="Quote"
                >
                    <Quote className="w-4 h-4" />
                </button>

                {onCaptureTimestamp && (
                    <>
                        <div className="flex-1" />
                        <button
                            onClick={onCaptureTimestamp}
                            className="px-3 py-1.5 rounded-lg bg-primary/20 text-primary hover:bg-primary/30 flex items-center gap-2 text-sm font-medium transition-colors"
                            title="Capture Timestamp"
                        >
                            <Clock className="w-4 h-4" />
                            Capture Time
                        </button>
                    </>
                )}
            </div>

            <div className="flex-1 overflow-y-auto overflow-x-hidden cursor-text text-base leading-relaxed" onClick={() => editor.chain().focus().run()}>
                <EditorContent editor={editor} className="h-full max-w-full break-words [&_.ProseMirror]:min-h-full" />
            </div>
        </div>
    );
}
