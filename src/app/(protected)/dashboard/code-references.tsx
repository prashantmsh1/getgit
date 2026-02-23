"use client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import React, { useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { lucario } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Code2 } from "lucide-react";

type Props = {
  fileReferences: {
    fileName: string ;
    sourceCode: string ;
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
      md: "markdown",
      sh: "bash",
      yml: "yaml",
      yaml: "yaml",
    };
    return languageMap[ext ?? ""] ?? "text";
  };

  if (!fileReferences || fileReferences.length === 0) {
    return null;
  }

  return (
    <div className="mt-2 flex max-w-full flex-col gap-4">
      <div className="text-muted-foreground flex items-center gap-2">
        <Code2 className="text-primary h-5 w-5" />
        <h2 className="text-foreground text-lg font-semibold">
          Code References
        </h2>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <div className="flex w-full overflow-x-auto pb-2">
          <TabsList className="bg-muted/50 h-auto w-max justify-start rounded-xl p-1 px-1 py-1">
            {fileReferences.map((ref) => (
              <TabsTrigger
                key={ref.fileName}
                value={ref.fileName}
                className="data-[state=active]:bg-background data-[state=active]:text-primary rounded-lg px-4 py-2 text-sm transition-all data-[state=active]:shadow-sm"
              >
                {ref.fileName}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {fileReferences.map((ref) => (
          <TabsContent
            key={ref.fileName}
            value={ref.fileName}
            className="border-border/50 mt-4 w-full overflow-hidden rounded-xl border bg-[#2b3e50]"
          >
            <div className="bg-muted/30 border-border/10 text-muted-foreground flex items-center justify-between border-b px-4 py-2 font-mono text-xs">
              <span>{ref.fileName}</span>
            </div>
            <SyntaxHighlighter
              showLineNumbers
              wrapLongLines
              customStyle={{
                margin: 0,
                padding: "1rem",
                overflowY: "auto",
                maxHeight: "500px",
                backgroundColor: "transparent",
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
