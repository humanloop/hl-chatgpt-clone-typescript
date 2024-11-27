"use client";

import { ChatMessage, ChatRole } from "humanloop/api";
import React, { useState } from "react";

interface Message {
  // we capture logId only for the assistant messages
  logId?: string;
  message: ChatMessage;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [userInputValue, setUserInputValue] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const onSend = async () => {
    const userMessage: ChatMessage = {
      role: "user",
      content: userInputValue,
    };

    setUserInputValue("");

    const newMessages = [
      ...messages,
      { message: userMessage },
      { message: { role: ChatRole.Assistant, content: "" } },
    ];

    setMessages(newMessages);

    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(newMessages.map((msg) => msg.message)),
    });

    if (!response.body) return;
    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const text = decoder.decode(value);
        const chunks = text.split("\n").filter((chunk) => chunk.trim());

        for (const chunk of chunks) {
          try {
            const parsed = JSON.parse(chunk);
            setMessages((messages) => {
              const updatedLastMessage = messages.slice(-1)[0];
              return [
                ...messages.slice(0, -1),
                {
                  ...updatedLastMessage,
                  logId: parsed.id,
                  message: {
                    role: ChatRole.Assistant,
                    content:
                      (updatedLastMessage.message.content as string) +
                      parsed.output,
                  },
                },
              ];
            });
          } catch (e) {
            console.error("Failed to parse chunk:", chunk);
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      onSend();
    }
  };

  const showFeedbackToast = (feedback: string) => {
    setToastMessage(
      feedback === "good"
        ? "👍 Captured your feedback!"
        : "👎  Captured your feedback!",
    );
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  return (
    <main className="flex flex-col items-center min-h-screen p-8 md:p-24">
      {showToast && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-4 py-2 rounded-md text-sm animate-fade-in-out z-50">
          {toastMessage}
        </div>
      )}
      <h1 className="text-2xl font-bold leading-7 text-gray-900 dark:text-gray-200 sm:truncate sm:text-3xl sm:tracking-tight">
        Customer Support Chat
      </h1>

      <div className="flex-col w-full mt-8">
        {messages.map((msg, idx) => (
          <MessageRow
            key={idx}
            logId={msg.logId}
            message={msg.message}
            showFeedbackToast={showFeedbackToast}
          ></MessageRow>
        ))}

        <div className="flex w-full">
          <div className="min-w-[70px] uppercase text-xs text-gray-500 dark:text-gray-300 pt-2">
            User
          </div>
          <input
            className="w-full px-4 py-1 mr-3 leading-tight text-gray-700 break-words bg-transparent border-none appearance-none dark:text-gray-200 flex-grow-1 focus:outline-none"
            type="text"
            placeholder="Type your message here..."
            aria-label="Prompt"
            value={userInputValue}
            onChange={(e) => setUserInputValue(e.target.value)}
            onKeyDown={(e) => handleKeyDown(e)}
          ></input>
          <button
            className="px-3 font-medium text-gray-500 uppercase border border-gray-300 rounded dark:border-gray-100 dark:text-gray-200 hover:border-blue-500 hover:text-blue-500"
            onClick={() => onSend()}
          >
            Send
          </button>
        </div>
      </div>
    </main>
  );
}

const MessageRow: React.FC<
  Message & { showFeedbackToast: (feedback: string) => void }
> = ({ message, logId, showFeedbackToast }) => {
  const captureUserFeedback = async (logId: string, feedback: string) => {
    const response = await fetch("/api/feedback", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ logId: logId, judgment: feedback }),
    });

    showFeedbackToast(feedback);
  };

  return (
    <div className="flex w-full pb-4 mb-4 border-b border-gray-300">
      <div className="min-w-[80px] uppercase text-xs text-gray-500 leading-tight pt-1">
        {message.role}
      </div>
      {message.content ? (
        <div className="flex w-full pl-4 whitespace-pre-line">
          {message.content as string}
        </div>
      ) : (
        <div className="flex w-full pl-4 whitespace-pre-line">...</div>
      )}
      {/* {logId && (
        <div className="debug flex justify-end gap-4 max-h-8">
          <button
            className="px-3 font-medium text-gray-500 uppercase border border-gray-300 rounded dark:border-gray-100 dark:text-gray-200 hover:border-blue-500 hover:text-blue-500"
            onClick={() => {
              captureUserFeedback(logId, "good");
            }}
          >
            👍
          </button>
          <button
            className="px-3 font-medium text-gray-500 uppercase border border-gray-300 rounded dark:border-gray-100 dark:text-gray-200 hover:border-blue-500 hover:text-blue-500"
            onClick={() => {
              captureUserFeedback(logId, "bad");
            }}
          >
            👎
          </button>
        </div>
      )} */}
    </div>
  );
};
