"use client";

import { ChatMessage } from "humanloop";
import * as React from "react";

const { useState } = React;

interface ChatListItem {
  id: string | null; // null for user messages, string for assistant messages
  message: ChatMessage;
}

export default function Home() {
  const [chatListItems, setChatListItems] = useState<ChatListItem[]>([]);
  const [inputValue, setInputValue] = useState("");

  const onSend = async () => {
    const userMessage: ChatMessage = {
      role: "user",
      content: inputValue,
    };

    setInputValue("");

    const newItems: ChatListItem[] = [
      ...chatListItems,
      { message: userMessage, id: null },
      { message: { role: "assistant", content: "" }, id: null },
    ];

    setChatListItems(newItems);

    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(newItems.slice(0, -1).map((item) => item.message)), // slice off the final message, which is the currently empty placeholder for the assistant response
    });

    if (!response.body) throw Error();

    const decoder = new TextDecoder();
    const reader = response.body.getReader();
    let done = false;
    while (!done) {
      const chunk = await reader.read();
      const value = chunk.value;
      done = chunk.done;
      const val = decoder.decode(value);
      const json_chunks = val
        .split("}{")
        .map(
          (s) =>
            (s.startsWith("{") ? "" : "{") + s + (s.endsWith("}") ? "" : "}")
        );
      const tokens = json_chunks.map((s) => JSON.parse(s).output).join("");
      const id = JSON.parse(json_chunks[0]).id;

      setChatListItems((chatListItems) => {
        const lastItem = chatListItems.slice(-1)[0];

        return [
          ...chatListItems.slice(0, -1),
          {
            ...lastItem,
            message: {
              ...lastItem.message,
              content: lastItem.message.content + tokens,
            },
            id,
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
      <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
        Chess Tutor
      </h1>
      <div className="flex-col w-full mt-8">
        {chatListItems.map((item, idx) => (
          <ChatItemRow key={idx} item={item}></ChatItemRow>
        ))}

        <div className="flex w-full">
          <div className="min-w-[80px] uppercase text-xs text-gray-500 dark:text-gray-300 pt-2">
            User
          </div>
          <input
            className="w-full px-4 py-1 mr-3 leading-tight text-gray-700 break-words bg-transparent border-none appearance-none dark:text-gray-200 flex-grow-1 focus:outline-none"
            type="text"
            placeholder="Type your message here..."
            aria-label="Prompt"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
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

interface ChatItemRowProps {
  item: ChatListItem;
}

const ChatItemRow: React.FC<ChatItemRowProps> = ({ item }) => {
  const onFeedback = async (feedback: string) => {
    const response = await fetch("/api/feedback", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id: item.id, value: feedback }),
    });
  };

  return (
    <div className="flex pb-4 mb-4 border-b border-gray-300">
      <div className="min-w-[80px] uppercase text-xs text-gray-500 dark:text-gray-300 leading-tight pt-1">
        {item.message.role}
      </div>
      <div className="pl-4 whitespace-pre-line">{item.message.content}</div>
      <div className="grow" />
      <div className="text-xs">
        {item.id !== null && (
          <div className="flex gap-2">
            <button
              className="p-1 bg-gray-100 border-gray-600 rounded hover:bg-gray-200 border-1"
              onClick={() => onFeedback("good")}
            >
              👍
            </button>
            <button
              className="p-1 bg-gray-100 border-gray-600 rounded hover:bg-gray-200 border-1"
              onClick={() => onFeedback("bad")}
            >
              👎
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
