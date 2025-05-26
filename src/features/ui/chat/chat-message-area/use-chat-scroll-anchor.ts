import { useEffect, RefObject, useState, useCallback } from "react";
import { useChat } from "@/features/chat-page/chat-store";

interface UseChatScrollAnchorProps {
  ref: RefObject<HTMLElement>;
  behavior?: ScrollBehavior;
}

// Helper to check if element is in viewport
const isElementInView = (element: HTMLElement, threshold = 100): boolean => {
  const rect = element.getBoundingClientRect();
  return rect.bottom <= window.innerHeight + threshold;
};

export function useChatScrollAnchor({
  ref,
  behavior = "smooth",
}: UseChatScrollAnchorProps) {
  const { messages, loading } = useChat();
  const [prevMessagesLength, setPrevMessagesLength] = useState(0);
  const [prevLastMessageContent, setPrevLastMessageContent] = useState<string>("");
  const [scrollTimeoutId, setScrollTimeoutId] = useState<NodeJS.Timeout | null>(null);
  
  // Track if this is the first message in a new conversation
  const [isFirstMessageInteraction, setIsFirstMessageInteraction] = useState(true);
  
  // Public scroll function that can be used by external components
  const scrollToBottom = useCallback(() => {
    if (!ref.current) return;
    ref.current.scrollTo({
      top: 0,
      behavior,
    });
  }, [ref, behavior]);
  
  // Internal scroll function used during streaming with optimized behavior
  const performScroll = useCallback(() => {
    if (!ref.current) return;
    
    ref.current.scrollTo({
      top: ref.current.scrollHeight, //ref.current.scrollHeight/5
      // Use "auto" for immediate scrolling during typing to avoid lag
      behavior: loading === "loading" ? "auto" : behavior,
    });
  }, [ref, behavior, loading]);
  
  // Debounced scroll function to prevent multiple rapid scrolls
  const debouncedScroll = useCallback(() => {
    // Clear any existing timeout
    if (scrollTimeoutId) {
      clearTimeout(scrollTimeoutId);
    }
    
    // Set a new timeout with shorter delay during loading for better responsiveness
    const delayTime = loading === "loading" ? 100 : 200;
    
    const timeoutId = setTimeout(() => {
      if (!ref.current) return;
      
      // Check if we're already at the bottom (with some threshold)
      const isAtBottom = isElementInView(ref.current);
      
      // During loading always scroll to follow content updates
      // Otherwise only scroll if not already at bottom
      if (loading === "loading" || !isAtBottom) {
        performScroll();
      }
    }, delayTime);
    
    setScrollTimeoutId(timeoutId);
  }, [ref, loading, performScroll, scrollTimeoutId]);

  // Effect for new messages and message content changes
  useEffect(() => {
    if (!ref.current) return;

    const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
    const lastMessageContent = lastMessage?.content || "";
    
    // Check if this is the start of a new conversation (0 to 1 message)
    const isNewConversationStart = prevMessagesLength === 0 && messages.length === 1;
    
    // After we've received an assistant response to the first message, mark first interaction as complete
    if (isFirstMessageInteraction && messages.length >= 2 && lastMessage?.role === "assistant") {
      setIsFirstMessageInteraction(false);
    }
    
    // Check if a new message was just added
    const newMessageAdded = messages.length > prevMessagesLength;
    
    // Check if the most recently added message is from the user
    const isUserMessageAdded = newMessageAdded && lastMessage?.role === "user";
    
    // Determine if we should scroll
    const shouldScroll = 
      // Never scroll when a user message is added
      !isUserMessageAdded && 
      (
        // New assistant/system message arrived
        (newMessageAdded && lastMessage && lastMessage.role !== "user") ||
        // Content of last message changed (streaming updates)
        (lastMessage && lastMessage.role === "assistant" && lastMessageContent !== prevLastMessageContent) ||
        // During loading state (but not right after user message)
        (loading === "loading" && (!lastMessage || lastMessage.role !== "user"))
      );
    
    if (shouldScroll) {
      debouncedScroll();
    }

    // Always update the previous message count and content
    setPrevMessagesLength(messages.length);
    if (lastMessage) {
      setPrevLastMessageContent(lastMessageContent);
    }
  }, [messages, loading, ref, debouncedScroll, prevMessagesLength, prevLastMessageContent, isFirstMessageInteraction]);

  // Reset first message interaction state when a new conversation is started
  useEffect(() => {
    const resetFirstMessageState = () => {
      setIsFirstMessageInteraction(true);
    };
    
    // Listen for custom event from chat store
    window.addEventListener('newConversationStarted', resetFirstMessageState);
    
    // Clean up event listener on unmount
    return () => {
      window.removeEventListener('newConversationStarted', resetFirstMessageState);
    };
  }, []);
  
  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutId) {
        clearTimeout(scrollTimeoutId);
      }
    };
  }, [scrollTimeoutId]);

  return { scrollToBottom };
}
