import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import Image from "next/image";
import { api } from "@/trpc/react";
import useRefetch from "@/hooks/use-refetch";
import { toast } from "sonner";
import {
  GitBranch,
  Loader2,
  MessageCircleQuestion,
  Save,
  Send,
  Sparkles,
} from "lucide-react";

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
    e.preventDefault();
    if (!project?.id || !question.trim()) return;

    setAnswer("");
    setFileReferences([]);
    setLoading(true);
    setIsOpen(true);

    try {
      const { output, fileReferences: rawFileReferences } =
        await streamGoogleAIResponse(question, project.id);

      setFileReferences(rawFileReferences);

      for await (const delta of readStreamableValue(output)) {
        if (delta) {
          setAnswer((prev) => `${prev}${delta}`);
        }
      }

      setLoading(false);
    } catch (error) {
      toast.error("Failed to fetch answer");
      setLoading(false);
    }
  };

  const refetch = useRefetch();

  const handleSave = () => {
    if (!project?.id) return;
    saveAnswer.mutate(
      {
        projectId: project.id,
        question,
        answer,
        fileReferences: fileReferences,
      },
      {
        onSuccess: () => {
          toast.success("Answer saved successfully");
          void refetch();
          setIsOpen(false);
        },
        onError: (error) => {
          toast.error("Failed to save answer: " + error.message);
        },
      },
    );
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="bg-background border-border/50 flex h-[90vh] w-full flex-col overflow-hidden rounded-xl p-0 shadow-2xl sm:max-w-[80vw]">
          <DialogHeader className="bg-card flex flex-row items-center justify-between border-b px-6 py-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="bg-primary shadow-primary/20 flex h-8 w-8 items-center justify-center rounded-lg shadow-md">
                <GitBranch className="h-5 w-5 text-white" />
              </div>
              <DialogTitle className="text-xl font-semibold tracking-tight">
                Ask GetGit
              </DialogTitle>
            </div>
            <Button
              variant="outline"
              className="gap-2 disabled:opacity-50"
              disabled={loading}
              onClick={handleSave}
            >
              <Save className="h-4 w-4" />
              Save Answer
            </Button>
          </DialogHeader>

          <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-6">
            {/* User Question */}
            <div className="flex justify-end">
              <div className="bg-primary text-primary-foreground max-w-[80%] rounded-2xl px-5 py-3 text-sm shadow-sm md:text-base">
                {question}
              </div>
            </div>

            {/* AI Answer */}
            <div className="flex flex-col gap-4">
              <div className="text-muted-foreground mb-2 flex items-center gap-2">
                <Sparkles className="text-primary h-5 w-5 animate-pulse" />
                <span className="text-sm font-medium">
                  GetGit AI is thinking...
                </span>
              </div>
              <div className="px-1" data-color-mode="light">
                <MDEditor.Markdown
                  source={
                    answer || (loading ? "Analyzing your codebase..." : "")
                  }
                  className="!text-foreground prose dark:prose-invert prose-pre:bg-muted prose-pre:text-muted-foreground prose-a:text-primary max-w-none !bg-transparent font-sans"
                />
              </div>

              {/* Code References */}
              {!loading && fileReferences.length > 0 && (
                <div className="mt-4 border-t pt-4">
                  <CodeReferences fileReferences={fileReferences} />
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Card
        className={cn(
          "border-border/50 bg-card/50 relative col-span-3 border shadow-sm backdrop-blur-sm",
          className,
        )}
      >
        <CardHeader className="flex flex-row items-center gap-2 pb-2">
          <MessageCircleQuestion className="text-primary h-5 w-5" />
          <CardTitle className="text-xl font-semibold">Ask GetGit</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="relative">
            <Textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Which file should I edit to change the homepage?"
              className="focus-visible:ring-primary/50 bg-background/50 min-h-[120px] resize-none pr-4 pb-12 text-base"
            />
            <Button
              type="submit"
              size="icon"
              disabled={loading || !question.trim()}
              className="absolute right-3 bottom-3 rounded-full transition-transform hover:scale-105"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </>
  );
};

export default AskQuestion;
