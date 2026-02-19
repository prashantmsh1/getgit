"use client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import React, { useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { lucario } from "react-syntax-highlighter/dist/esm/styles/prism";

type Props = {
  fileReferences: {
    fileName: string;
    sourceCode: string;
    summary: string;
  }[];
};

function CodeReferences({ fileReferences }: Props) {
  const [tab, setTab] = useState(fileReferences[0]?.fileName);

  const unescapeSourceCode = (code: string): string => {
    let cleaned = code;
    // Remove outer double quotes if present
    if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
      cleaned = cleaned.slice(1, -1);
    }
    return cleaned
      .replace(/\\n/g, "\n")
      .replace(/\\t/g, "\t")
      .replace(/\\r/g, "\r")
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, "\\")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&amp;/g, "&");
  };

  const getLanguageFromFileName = (fileName: string): string => {
    const ext = fileName.split(".").pop()?.toLowerCase();
    const languageMap: Record<string, string> = {
      tsx: "tsx",
      ts: "typescript",
      jsx: "jsx",
      js: "javascript",
      py: "python",
      java: "java",
      json: "json",
      html: "html",
      css: "css",
      sql: "sql",
    };
    return languageMap[ext ?? ""] || "text";
  };
  if (!fileReferences || fileReferences.length === 0) {
    return null;
  }
  return (
    <div className="max-h-[50vh] max-w-[70vw]">
      <h2>Code References</h2>
      <Tabs value={tab} onValueChange={setTab} className="mt-4">
        <div className="flex max-w-[80vw] gap-x-2 overflow-x-scroll">
          {fileReferences.map((ref) => (
            <Button
              key={ref.fileName}
              value={ref.fileName}
              className={cn(
                "rounded-xl border-b-2 border-b-transparent px-4 py-2",
                tab === ref.fileName
                  ? "border-b-primary font-medium"
                  : "border border-t-gray-300 bg-gray-100 text-gray-900 hover:bg-gray-100",
              )}
              onClick={() => setTab(ref.fileName)}
            >
              {ref.fileName}
            </Button>
          ))}
        </div>

        {fileReferences.map((ref) => (
          <TabsContent
            key={ref.fileName}
            value={ref.fileName}
            className="mt-4 max-w-7xl"
          >
            <SyntaxHighlighter
              showLineNumbers
              wrapLongLines
              customStyle={{
                overflowY: "scroll",
                maxHeight: 600,
              }}
              language={getLanguageFromFileName(ref.fileName)}
              style={lucario}
            >
              {unescapeSourceCode(ref.sourceCode)}
            </SyntaxHighlighter>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

export default CodeReferences;
