"use client";

import { useCallback, useMemo, useRef, useEffect } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { EditorView } from "@codemirror/view";
import { markdown } from "@codemirror/lang-markdown";
import { useMarkdownContentStore } from "@/store/useMarkdownContentStore";
import { useImageStore } from "@/store/useImageStore";
import { ResetIcon } from "@/components/icons/ResetIcon";
import { KebabMenuIcon } from "@/components/icons/KebabMenuIcon";

const CODEMIRROR_BASIC_SETUP = {
  lineNumbers: false,
  foldGutter: false,
  dropCursor: false,
  allowMultipleSelections: false,
  indentOnInput: true,
};

export function MarkdownEditor() {
  const { content, setContent, resetContent } = useMarkdownContentStore();
  const addImage = useImageStore((state) => state.addImage);

  // Use ref to store the latest addImage to avoid recreating the extension
  const addImageRef = useRef(addImage);
  useEffect(() => {
    addImageRef.current = addImage;
  }, [addImage]);

  const handleChange = useCallback(
    (value: string) => {
      setContent(value);
    },
    [setContent]
  );

  // Create a stable CodeMirror extension to handle paste events
  // Using ref ensures the extension is created only once
  const pasteExtension = useMemo(
    () =>
      EditorView.domEventHandlers({
        paste: (event, view) => {
          const items = event.clipboardData?.items;
          if (!items) return false;

          for (const item of Array.from(items)) {
            if (item.type.startsWith("image/")) {
              event.preventDefault();
              const file = item.getAsFile();
              if (!file) continue;

              const reader = new FileReader();
              reader.onload = (e) => {
                const dataUrl = e.target?.result as string;
                const id = `img-${Date.now()}-${Math.random().toString(36).slice(2)}`;
                addImageRef.current({
                  id,
                  dataUrl,
                  name: file.name,
                });

                // Insert image markdown at cursor position
                const imageMarkdown = `\n![${file.name || "image"}](${id})\n`;

                const transaction = view.state.update({
                  changes: {
                    from: view.state.selection.main.from,
                    insert: imageMarkdown,
                  },
                });
                view.dispatch(transaction);
              };
              reader.readAsDataURL(file);
              return true;
            }
          }
          return false;
        },
      }),
    []
  );

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 py-3 border-b border-apple-border flex items-center justify-between shrink-0">
        <h2 className="text-sm font-medium text-gray-700">编辑器</h2>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={resetContent}
            className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <ResetIcon className="w-4 h-4" />
            重置示例
          </button>
          <button
            type="button"
            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
            aria-label="更多选项"
          >
            <KebabMenuIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-x-hidden overflow-y-auto min-h-0">
        <CodeMirror
          value={content}
          height="100%"
          extensions={[markdown(), EditorView.lineWrapping, pasteExtension]}
          onChange={handleChange}
          className="text-sm"
          basicSetup={CODEMIRROR_BASIC_SETUP}
        />
      </div>
    </div>
  );
}
