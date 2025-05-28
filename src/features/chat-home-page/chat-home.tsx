"use client";
import { AddExtension } from "@/features/extensions-page/add-extension/add-new-extension";
import { ExtensionCard } from "@/features/extensions-page/extension-card/extension-card";
import { ExtensionModel } from "@/features/extensions-page/extension-services/models";
import { ChatInput } from "@/features/chat-page/chat-input/chat-input";
import { chatStore, useChat } from "@/features/chat-page/chat-store";
import { PersonaCard } from "@/features/persona-page/persona-card/persona-card";
import { PersonaModel } from "@/features/persona-page/persona-services/models";
import { ChatHomeHeader } from "./chat-home-header/chat-home-header";
import { ScrollArea } from "@/features/ui/scroll-area";
import { ChatLoading } from "@/features/ui/chat/chat-message-area/chat-loading";
import Disclaimer from "@/features/ui/chat/disclaimer";
import { FC, useEffect } from "react";
import { NEW_CHAT_NAME } from "@/features/theme/theme-config";
import Link from "next/link";

interface ChatPersonaProps {
  personas: PersonaModel[];
  extensions: ExtensionModel[];
}

export const ChatHome: FC<ChatPersonaProps> = (props) => {
  const { loading } = useChat();
  
  // Reset chat store when component mounts
  useEffect(() => {
    // Reset the chat store to ensure a fresh state
    chatStore.initChatSession({
      chatThread: {
        id: "", // Empty ID will trigger new thread creation
        name: NEW_CHAT_NAME,
        createdAt: new Date(),
        lastMessageAt: new Date(),
        userId: "",
        useName: "",
        isDeleted: false,
        bookmarked: false,
        personaMessage: "",
        personaMessageTitle: "",
        extension: [],
        type: "CHAT_THREAD",
      },
      messages: [],
      userName: chatStore.userName || "",
    });
  }, []);
type NewsItem = {
  title: string;
  text: string;
  link?: string;
};
  const news: NewsItem[] = [
    {
      title: "What's new on AICO",
      text: "We're thrilled to announce some major upgrades to our AI solution that will enhance your experience and productivity.",
      link: "https://docs.google.com/document/d/1A-BMwI0wUEMvUq7FtCT8sk83az5aH6rJiKjVm-98GSw/edit?tab=t.0#heading=h.up4knif3vprz"
    },
    {
      title: "AI Suggest training",
      text: "Discover our new Generative AI courses: boost your skills, stay ahead of the curve, and explore the future of work with cutting-edge training designed for all employees. Start today!",
      link: "https://comau.percipio.com/search?categories=Course&expertiseLevels=BEGINNER&q=introduction%20to%20generative%20ai&ratings=4"
    },
    {
      title: "PPT Translator",
      text: "This tool translates text within .docx and .pptx files while attempting to preserve formatting.",
      link: "https://aicopt.comau.com"
    }
  ];

  return (
    <main className="flex flex-1 relative flex-col h-screen overflow-hidden">
      <ChatHomeHeader />
      {/* Loading overlay shown when submitting a chat */}
      <div 
        className={`absolute inset-0 bg-background z-50 flex items-center justify-center transition-opacity duration-300 ${
          loading === "loading" ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
      </div>
      <ScrollArea className="flex-1" style={{ height: 'calc(100vh - 190px)' }}>
        <div className="flex flex-1 flex-col gap-6 pb-6 pt-6">
        <div className="container max-w-4xl flex gap-20 flex-col">
          <div>
            <h2 className="text-2xl font-bold mb-3">Highlights</h2>
            <div>
              {news && news.length > 0 ? (
                <div className="grid grid-cols-3 gap-3">
                  {news.map((item, index) => (
                    <div key={index} className="rounded-2xl border bg-card text-card-foreground shadow p-4">
                    <h3 className="text-lg font-semibold mb-1">{item.title}</h3>
                    <p className="text-sm text-muted-foreground mb-2">{item.text}</p>
                    {item.link && (
                    <a
                      href={item.link}
                      className="text-sm text-primary hover:underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Follow →
                    </a>
                  )}
                  </div>
                ))}
                </div>
              ) : (
              <p className="text-muted-foreground">Nessuna news disponibile</p>
               )}
              </div>
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-3">Comau Prompt</h2>

            {props.personas && props.personas.length > 0 ? (
              <div className="grid grid-cols-3 gap-3">
                {props.personas.map((persona) => {
                  return (
                    <PersonaCard
                      persona={persona}
                      key={persona.id}
                      showContextMenu={false}
                    />
                  );
                })}
              </div>
            ) :
              <p className="text-muted-foreground max-w-xl">No personas created</p>
            }
          </div>
          </div>
          <AddExtension />
        </div>
      </ScrollArea>
      
      {/* Footer with chat input below Line 2 */}
      <div className="py-4 bg-white dark:bg-slate-950">
        <div className="flex flex-col items-center px-4 max-w-4xl mx-auto w-full">
          <div className="w-full backdrop-blur rounded-xl ">
            <ChatInput />
          </div>
           <div className="mt-2 text-center text-xs">
        <Disclaimer
  text={
    <>
      COMAU AICO generated content may be inaccurate.{" "}
      <span>
        <Link
          href="https://drive.google.com/file/d/1OXkt4Z9hVoy4rXGFBOhzR9e0LJers5fJ/view"
          target="_blank"
          rel="noopener noreferrer"
        >
          Refered Policy
        </Link>
      </span>
      . <br />
      AICO Model Last update October 2023
    </>
  }
/>
        </div>
        </div>
      </div>
    </main>
  );
};
