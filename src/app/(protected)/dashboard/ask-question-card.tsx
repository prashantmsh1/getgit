import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Dialog,
  DialogHeader,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import useProjects from "@/hooks/use-project";
import { cn } from "@/lib/utils";
import React, { useState } from "react";
import { streamGoogleAIResponse } from "./actions";
import { readStreamableValue } from "@ai-sdk/rsc";
import MDEditor from "@uiw/react-md-editor";
import CodeReferences from "./code-references";
import type { FileReference } from "typescript";
import Image from "next/image";
import { api } from "@/trpc/react";
import useRefetch from "@/hooks/use-refetch";
import { toast } from "sonner";

interface AskQuestionProps {
  className?: string;
}
interface FileReferences {
  fileName: string;
  sourceCode: string;
  summary: string;
}
const AskQuestion = ({ className }: AskQuestionProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState("");
  const [question, setQuestion] = useState("");
  const [fileReferences, setFileReferences] = useState<FileReferences[]>([]);

  const saveAnswer = api.project.saveAnswer.useMutation();
  const { project } = useProjects();
  const handleSubmit = async (e: React.FormEvent) => {
    setAnswer("");
    setFileReferences([]);
    e.preventDefault();

    if (!project?.id) return;
    // Handle form submission logic here

    setLoading(true);
    setIsOpen(true);

    try {
      const { output, fileReferences: rawFileReferences } =
        await streamGoogleAIResponse(question, project.id);
      setIsOpen(true);

      console.log("output", output);
      setFileReferences(rawFileReferences);

      for await (const delta of readStreamableValue(output)) {
        if (delta) {
          console.log("delta", delta);
          setAnswer((prev) => `${prev}${delta}`);
        }
      }

      setLoading(false);
    } catch (error) {}
  };

  const refetch = useRefetch();
  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="h-[95svh] w-full overflow-auto overflow-y-scroll">
          <DialogHeader className="flex flex-row">
            <DialogTitle>
              <Image src="/logo.png" alt="Logo" width={40} height={40} />
            </DialogTitle>
            <Button
              className="disabled:bg-gray-300"
              disabled={loading}
              onClick={() => {
                saveAnswer.mutate(
                  {
                    projectId: project!.id,
                    question,
                    answer,
                    fileReferences: fileReferences,
                  },
                  {
                    onSuccess: () => {
                      toast.success("Answer saved successfully");
                      void refetch();
                    },
                    onError: (error) => {
                      toast.error("Failed to save answer: " + error.message);
                    },
                  },
                );
                setIsOpen(false);
              }}
            >
              Save Answer
            </Button>
          </DialogHeader>

          <MDEditor.Markdown
            source={answer || (loading ? "Generating answer..." : "")}
            className="h-full! max-w-[70vw] overflow-y-auto"
          />
          <CodeReferences fileReferences={fileReferences} />
        </DialogContent>
      </Dialog>

      <Card className={cn("col-span-3", className)}>
        <CardHeader className="text-lg font-medium">Ask a Question</CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <Textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="What file should I edit to change the homepage"
            />
            <Button className="mt-4">Ask GetGit</Button>
          </form>
        </CardContent>
      </Card>
    </>
  );
};

export default AskQuestion;
