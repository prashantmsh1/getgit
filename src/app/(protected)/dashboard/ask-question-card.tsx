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
import { string } from "zod/v4";
import { readStreamableValue } from "@ai-sdk/rsc";
import MDEditor from "@uiw/react-md-editor";

interface AskQuestionProps {
  className?: string;
}

const AskQuestion = ({ className }: AskQuestionProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState("");
  const [fileReferences, setFileReferences] = useState<string[]>([]);
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
        await streamGoogleAIResponse(
          "What file should I edit to change the homepage",
          project.id,
        );

      console.log("output", output);
      setFileReferences(rawFileReferences.map((ref) => ref.fileName));

      for await (const delta of readStreamableValue(output)) {
        if (delta) {
          setAnswer((prev) => prev + delta);
        }
      }

      setLoading(false);
    } catch (error) {}
  };
  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ask a Question</DialogTitle>
          </DialogHeader>

          <MDEditor.Markdown
            source={loading ? "Loading..." : answer}
            className="h-full max-h-[40vh] max-w-[70vw] overflow-y-auto"
          />
        </DialogContent>
      </Dialog>

      <Card className={cn("col-span-3", className)}>
        <CardHeader className="text-lg font-medium">Ask a Question</CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <Textarea placeholder="What file should I edit to change the homepage" />
            <Button className="mt-4">Ask GetGit</Button>
          </form>
        </CardContent>
      </Card>
    </>
  );
};

export default AskQuestion;
