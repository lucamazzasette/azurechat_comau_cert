"use server";
import "server-only";

import { ServerActionResponse } from "@/features/common/server-action-response";
import { OpenAIDALLEInstance } from "@/features/common/services/openai";
import { uniqueId } from "@/features/common/util";
import { GetImageUrl, UploadImageToStore } from "../chat-image-service";
import { ChatThreadModel } from "../models";

export const GetDefaultExtensions = async (props: {
  chatThread: ChatThreadModel;
  userMessage: string;
  signal: AbortSignal;
}): Promise<ServerActionResponse<Array<any>>> => {
  const defaultExtensions: Array<any> = [];

  // Add image creation Extension
  defaultExtensions.push({
    type: "function",
    function: {
      function: async (args: any) => await executeCreateImage(args, props.chatThread.id, props.userMessage, props.signal),
      parse: (input: string) => JSON.parse(input),
      parameters: { type: "object", properties: { prompt: { type: "string" } } },
      description: "You must only use this tool if the user asks you to create an image.",
      name: "create_img",
    },
  });

  // GoogleSearch
  defaultExtensions.push({
    type: "function",
    function: {
      function: async (args: any) => await executeGoogleSearch(args.q),
      parse: (input: string) => JSON.parse(input),
      parameters: {
        type: "object",
        properties: { q: { type: "string" } },
        required: ["q"],
      },
      description: "Cerca informazioni aggiornate sul web utilizzando Google Search.",
      name: "GoogleSearch",
    },
  });

  return { status: "OK", response: defaultExtensions };
};

async function executeCreateImage(args: { prompt: string }, threadId: string, userMessage: string, signal: AbortSignal) {
  if (!args.prompt) return "No prompt provided";
  const openAI = OpenAIDALLEInstance();
  try {
    const response = await openAI.images.generate({ model: "dall-e-3", prompt: userMessage, response_format: "b64_json" }, { signal });
    const imageName = `${uniqueId()}.png`;
    await UploadImageToStore(threadId, imageName, Buffer.from(response.data[0].b64_json!, "base64"));
    return { url: GetImageUrl(threadId, imageName) };
  } catch (error) { return { error: "Error: " + error }; }
}

async function executeGoogleSearch(query: string) {
  const apiKey = process.env.GOOGLE_SEARCH_API_KEY;
  if (!apiKey) return "Errore: Chiave API non configurata.";
  const url = `https://serpapi.com/search?engine=google&q=${encodeURIComponent(query)}&api_key=${apiKey}`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    const results = data.news_results || data.organic_results || [];
    return results.length === 0 ? "Nessun risultato trovato." : JSON.stringify(results.slice(0, 3));
  } catch (error) { return "Errore ricerca web: " + error; }
}