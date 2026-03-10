import {
  ChatCompletionMessageParam,
} from "openai/resources/chat/completions";
import { ChatMessageModel } from "./models";

export const mapOpenAIChatMessages = (
  messages: ChatMessageModel[]
): ChatCompletionMessageParam[] => {
  const result: ChatCompletionMessageParam[] = [];

  for (let i = 0; i < messages.length; i++) {
    const message = messages[i];
    const prevMessage = i > 0 ? messages[i - 1] : null;

    // 1. Gestione messaggi Tool
    if (message.role === "function" || message.role === "tool") {
      // VERIFICA: L'assistente precedente ha chiamato un tool?
      const assistantHadToolCalls = prevMessage && 
                                   prevMessage.role === 'assistant' && 
                                   (prevMessage as any).tool_calls;
      
      if (assistantHadToolCalls) {
        result.push({
          role: "tool",
          tool_call_id: (message as any).tool_call_id || "call_fix_999",
          content: message.content || "{}",
        });
      } else {
        console.warn(`⚠️ Scartato messaggio tool orfano (id: ${message.id}) perché manca il riferimento all'assistant.`);
      }
    } 
    // 2. Gestione Assistant
    else if (message.role === "assistant") {
      const toolCalls = (message as any).tool_calls;
      const parsedToolCalls = toolCalls ? (typeof toolCalls === 'string' ? JSON.parse(toolCalls) : toolCalls) : undefined;
      
      result.push({
        role: "assistant",
        content: message.content || null,
        tool_calls: parsedToolCalls
      });
    } 
    // 3. User / System
    else {
      result.push({
        role: message.role as any,
        content: message.content || "",
      });
    }
  }
  return result;
};