"use client";

import { ChatMessage, ChatRole } from "humanloop/api";
import * as React from "react";

const { useState } = React;

export default function Home() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [userInputValue, setUserInputValue] = useState("");

  const onSend = async () => {
    const userMessage: ChatMessage = {
      role: "user",
      content: userInputValue,
    };

    setUserInputValue("");

    const newMessages = [
      ...messages,
      userMessage,
      { role: ChatRole.Assistant, content: "" },
    ];

    setMessages(newMessages);

    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(newMessages),
    });

    const decoder = new TextDecoder();
    const reader = response?.body?.getReader();
    let done = false;
    while (!done && reader) {
      const chunk = await reader.read();
      const value = chunk.value;
      done = chunk.done;
      const val = decoder.decode(value);
      const jsonChunks = val
        .split("}{")
        .map(
          (s) =>
            (s.startsWith("{") ? "" : "{") + s + (s.endsWith("}") ? "" : "}")
        );
      const tokens = jsonChunks.map((s) => JSON.parse(s).output).join("");
      setMessages((messages) => {
        const updatedLastMessage = messages.slice(-1)[0];
        return [
          ...messages.slice(0, -1),
          {
            ...updatedLastMessage,
            content: (updatedLastMessage.content as string) + tokens,
          },
        ];
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      onSend();
    }
  };

  return (
    <main className="flex flex-col items-center min-h-screen p-8 md:p-24">
      <h1 className="text-2xl font-bold leading-7 text-gray-900 dark:text-gray-200 sm:truncate sm:text-3xl sm:tracking-tight">
        Customer Support Chat
      </h1>

      <div className="flex-col w-full mt-8">
        {messages.map((msg, idx) => (
          <MessageRow key={idx} msg={msg}></MessageRow>
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

interface MessageRowProps {
  msg: ChatMessage;
}

const MessageRow: React.FC<MessageRowProps> = ({ msg }) => {
  return (
    <div className="flex pb-4 mb-4 border-b border-gray-300">
      <div className="min-w-[80px] uppercase text-xs text-gray-500 leading-tight pt-1">
        {msg.role}
      </div>
      <div className="pl-4 whitespace-pre-line">{msg.content as string}</div>
    </div>
  );
};
