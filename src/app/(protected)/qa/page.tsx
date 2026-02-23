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

const QaPage = () => {
  const { projectId } = useProjects();
  const { data: questions } = api.project.getQuestions.useQuery({
    projectId: projectId || "",
  });
  const [questionIndex, setQuestionIndex] = React.useState<number | null>(null);
  return (
    <Sheet>
      <AskQuestion />
      <h1 className="my-4 text-xl font-semibold">Saved Question</h1>
      <div className="flex flex-col gap-2">
        {questions?.map((question) => {
          return (
            <React.Fragment key={question.id}>
              <SheetTrigger onClick={() => setQuestionIndex(question.id)}>
                <div className="flex flex-row items-center gap-x-4 rounded border-gray-300 bg-gray-50 p-4 shadow">
                  <Image
                    width={40}
                    height={40}
                    className="size-10 rounded-full"
                    src={question.user?.imageUrl}
                    alt="Image"
                  />

                  <div className="flex flex-col text-left">
                    <div className="flex items-center gap-2">
                      <p className="line-clamp-1 text-lg font-medium text-gray-700">
                        {question.question}
                      </p>
                      <span className="line-clamp-1 text-xs whitespace-nowrap">
                        {question.createdAt.toLocaleDateString()}
                      </span>
                    </div>
                    <p className="line-clamp-1 text-sm text-gray-500">
                      {question.answer}
                    </p>
                  </div>
                </div>
              </SheetTrigger>
            </React.Fragment>
          );
        })}
      </div>

      {questionIndex && (
        <SheetContent className="overflow-y-scroll sm:max-w-[80vw]">
          <SheetHeader>
            <SheetTitle className="text-foreground border-border/50 mb-4 border-b pb-2 text-2xl font-bold tracking-tight sm:text-3xl">
              {questions?.find((q) => q.id === questionIndex)?.question}
            </SheetTitle>
            <MDEditor.Markdown
              source={questions?.find((q) => q.id === questionIndex)?.answer}
            />
            <CodeReferences
              fileReferences={
                (questions?.find((q) => q.id === questionIndex)
                  ?.fileReferences as {
                  fileName: string;
                  sourceCode: string;
                  summary: string;
                }[]) ?? []
              }
            />
          </SheetHeader>
        </SheetContent>
      )}
    </Sheet>
  );
};

export default QaPage;
