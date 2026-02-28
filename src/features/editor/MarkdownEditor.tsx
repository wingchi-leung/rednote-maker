"use client";

import { useCallback } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { markdown } from "@codemirror/lang-markdown";
import { useMarkdownContentStore } from "@/store/useMarkdownContentStore";

export function MarkdownEditor() {
  const { content, setContent } = useMarkdownContentStore();

  const handleChange = useCallback(
    (value: string) => {
      setContent(value);
    },
    [setContent]
  );

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 py-3 border-b border-apple-border bg-white">
        <h2 className="text-sm font-medium text-gray-700">Markdown 编辑器</h2>
      </div>
      <div className="flex-1 overflow-auto">
        <CodeMirror
          value={content}
          height="100%"
          extensions={[markdown()]}
          onChange={handleChange}
          className="text-sm"
          basicSetup={{
            lineNumbers: false,
            foldGutter: false,
            dropCursor: false,
            allowMultipleSelections: false,
            indentOnInput: true,
          }}
        />
      </div>
    </div>
  );
}
