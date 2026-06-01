import { useEffect, useRef, useState } from "react";
import axios from "axios";
import ChatBubble from "../components/ChatBubble";
import ResultCard from "../components/ResultCard";

const INITIAL_AI =
  "Hi! Tell me what you are looking for in a car — budget, family size, city or highway — anything helps.";

const API_BASE = import.meta.env.VITE_API_URL || "";
const API_CHAT = `${API_BASE}/api/chat`;

const ERROR_MESSAGE =
  "Something went wrong. Please check your connection and try again.";

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export default function Home() {
  const [messages, setMessages] = useState([
    { id: "welcome", text: INITIAL_AI, sender: "ai" },
  ]);
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [input, setInput] = useState("");
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleStartOver = () => {
    setMessages([{ id: "welcome", text: INITIAL_AI, sender: "ai" }]);
    setResults([]);
    setInput("");
    setIsLoading(false);
  };

  const handleSend = async (e) => {
    e?.preventDefault();
    const text = input.trim();
    if (!text || isLoading) return;

    setInput("");

    const history = messages
      .filter((m) => !m.isTyping)
      .map((m) => ({
        role: m.sender === "user" ? "user" : "assistant",
        content: m.text,
      }));

    setMessages((prev) => [
      ...prev,
      { id: makeId(), text, sender: "user" },
      { id: "typing", text: "", sender: "ai", isTyping: true },
    ]);
    setIsLoading(true);

    try {
      const { data } = await axios.post(API_CHAT, { message: text, history });

      setMessages((prev) => {
        const withoutTyping = prev.filter((m) => !m.isTyping);
        if (data.type === "question") {
          return [
            ...withoutTyping,
            {
              id: makeId(),
              text: data.question,
              sender: "ai",
            },
          ];
        }
        if (data.type === "results") {
          return [
            ...withoutTyping,
            {
              id: makeId(),
              text: "Found you some matches!",
              sender: "ai",
            },
          ];
        }
        return withoutTyping;
      });

      if (data.type === "results") {
        setResults(data.results || []);
      }
    } catch (err) {
      const apiMessage = err.response?.data?.error;
      setMessages((prev) => {
        const withoutTyping = prev.filter((m) => !m.isTyping);
        return [
          ...withoutTyping,
          {
            id: makeId(),
            text: apiMessage || ERROR_MESSAGE,
            sender: "ai",
            isError: true,
          },
        ];
      });
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  return (
    <div className="min-h-dvh bg-slate-50">
      <header className="bg-[#0f2744] px-4 py-6 text-white shadow-lg sm:px-6">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            CarFinder
          </h1>
          <p className="mt-1 text-sm text-blue-100 sm:text-base">
            Describe what you need. Get a shortlist.
          </p>
        </div>
      </header>

      <main className="mx-auto flex max-w-2xl flex-col px-4 py-4 sm:px-6 sm:py-6">
        <section className="flex flex-col overflow-hidden rounded-2xl bg-white shadow-md ring-1 ring-slate-100">
          <div className="flex h-[min(420px,55dvh)] flex-col">
            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {messages.map((m) => (
                <ChatBubble
                  key={m.id}
                  text={m.text}
                  sender={m.sender}
                  isTyping={m.isTyping}
                  isError={m.isError}
                />
              ))}
              <div ref={chatEndRef} />
            </div>

            <form
              onSubmit={handleSend}
              className="flex items-center gap-2 border-t border-slate-100 bg-white p-3"
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message…"
                disabled={isLoading}
                className="min-w-0 flex-1 rounded-full border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="shrink-0 rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Send
              </button>
            </form>
          </div>
        </section>

        {results.length > 0 && (
          <section className="mt-6 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-slate-900">
                Your shortlist
              </h2>
              <button
                type="button"
                onClick={handleStartOver}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-blue-300 hover:text-blue-600"
              >
                Start over
              </button>
            </div>
            <div className="space-y-5">
              {results.map((car) => (
                <ResultCard key={car.id} car={car} />
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
