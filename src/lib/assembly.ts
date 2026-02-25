import { AssemblyAI } from "assemblyai";

const baseUrl = "https://api.assemblyai.com";
const client = new AssemblyAI({
  apiKey: process.env.ASSEMBLYAI_API_KEY!,
  baseUrl: baseUrl,
});

const msToTime = (ms: number) => {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
};

export const processMeeting = async (meetingUrl: string) => {
  const transcript = await client.transcripts.transcribe({
    audio_url: meetingUrl,
    auto_chapters: true,
    speech_models: ["universal-2"],
  });

  const summaries =
    transcript.chapters?.map((chapter) => {
      return {
        start: msToTime(chapter.start),
        end: msToTime(chapter.end),
        gist: chapter.gist,
        headline: chapter.headline,
        summary: chapter.summary,
      };
    }) ?? [];

  return {
    transcript,
    summaries,
  };
};

