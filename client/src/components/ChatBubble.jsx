export default function ChatBubble({ text, sender, isTyping, isError }) {
  const isUser = sender === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm ${
          isUser
            ? "rounded-br-md bg-blue-600 text-white"
            : isError
              ? "rounded-bl-md border border-red-200 bg-red-50 text-red-800"
              : "rounded-bl-md bg-slate-100 text-slate-800"
        }`}
      >
        {isTyping ? (
          <span className="flex items-center gap-1 py-1" aria-label="Typing">
            <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:0ms]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:150ms]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:300ms]" />
          </span>
        ) : (
          text
        )}
      </div>
    </div>
  );
}
