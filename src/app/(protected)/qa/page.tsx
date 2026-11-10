"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import useProjects from "@/hooks/use-project";
import { api } from "@/trpc/react";
import React from "react";
import AskQuestion from "../dashboard/ask-question-card";
import Image from "next/image";
import MDEditor from "@uiw/react-md-editor";
import CodeReferences from "../dashboard/code-references";
import { useTheme } from "next-themes";
import { Bot, MessageSquare } from "lucide-react";

const QaPage = () => {
  const { projectId } = useProjects();
  const { resolvedTheme } = useTheme();
  const { data: questions, isLoading } = api.project.getQuestions.useQuery({
    projectId: projectId || "",
  });
  const [questionIndex, setQuestionIndex] = React.useState<number | null>(null);

  const selectedQuestion = questions?.find((q) => q.id === questionIndex);

  return (
    <Sheet>
      <div className="mx-auto flex max-w-6xl flex-col gap-6 pb-12">
        <AskQuestion />

        <div className="flex flex-col gap-3">
          <h1 className="text-xl font-semibold tracking-tight">Saved Questions</h1>

          {isLoading ? (
            <div className="text-muted-foreground py-8 text-center text-sm">
              Loading saved questions...
            </div>
          ) : !questions || questions.length === 0 ? (
            <div className="border-border bg-card/50 flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed py-12 text-center">
              <MessageSquare className="text-muted-foreground/60 h-8 w-8" />
              <p className="text-foreground text-sm font-medium">No saved questions yet</p>
              <p className="text-muted-foreground text-xs">
                Ask a question above and click &quot;Save Answer&quot; to keep it here.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {questions.map((question) => {
                return (
                  <React.Fragment key={question.id}>
                    <SheetTrigger asChild onClick={() => setQuestionIndex(question.id)}>
                      <div className="border-border bg-card hover:bg-accent/40 flex cursor-pointer flex-row items-center gap-x-4 rounded-xl border p-4 shadow-xs transition-colors">
                        {question.user?.imageUrl ? (
                          <Image
                            width={40}
                            height={40}
                            className="size-10 shrink-0 rounded-full object-cover"
                            src={question.user.imageUrl}
                            alt={question.user.name || "User"}
                          />
                        ) : (
                          <div className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold">
                            {question.user?.firstName?.charAt(0) || "U"}
                          </div>
                        )}

                        <div className="min-w-0 flex-1 text-left">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-foreground line-clamp-1 text-base font-medium">
                              {question.question}
                            </p>
                            <span className="text-muted-foreground shrink-0 text-xs whitespace-nowrap">
                              {new Date(question.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-muted-foreground line-clamp-1 mt-1 text-sm">
                            {question.answer}
                          </p>
                        </div>
                      </div>
                    </SheetTrigger>
                  </React.Fragment>
                );
              })}
            </div>
          )}
        </div>

        {selectedQuestion && (
          <SheetContent className="overflow-y-auto sm:max-w-[80vw]">
            <SheetHeader className="text-left">
              <SheetTitle className="text-foreground border-border/50 mb-4 border-b pb-3 text-2xl font-bold tracking-tight">
                {selectedQuestion.question}
              </SheetTitle>
              <div
                className="px-1"
                data-color-mode={resolvedTheme === "dark" ? "dark" : "light"}
              >
                <MDEditor.Markdown
                  source={selectedQuestion.answer}
                  className="!text-foreground prose dark:prose-invert prose-pre:bg-muted prose-pre:text-muted-foreground prose-a:text-primary max-w-none !bg-transparent font-sans"
                />
              </div>
              <CodeReferences
                fileReferences={
                  (selectedQuestion.fileReferences as {
                    fileName: string;
                    sourceCode: string;
                    summary: string;
                  }[]) ?? []
                }
              />
            </SheetHeader>
          </SheetContent>
        )}
      </div>
    </Sheet>
  );
};

export default QaPage;
