"use client";
import { useEffect, useRef, useState } from "react";

type Msg = { from: "me" | "bot"; text: string; buttons?: string[]; link?: { label: string; url: string } };

export default function Chat() {
  const [id, setId] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let v = "";
    try { v = localStorage.getItem("ft-chat-id") || ""; } catch {}
    if (!v) { v = Math.random().toString(36).slice(2); try { localStorage.setItem("ft-chat-id", v); } catch {} }
    setId(v);
  }, []);
  useEffect(() => end.current?.scrollIntoView({ behavior: "smooth" }), [msgs]);

  async function send(t: string) {
    if (!t.trim() || !id) return;
    setMsgs((m) => [...m, { from: "me", text: t }]);
    setText("");
    // A failed request shows a retry note instead of crashing the page.
    let replies: Omit<Msg, "from">[] = [{ text: "Sorry, something went wrong. Please try again." }];
    try {
      const r = await fetch("/api/simulate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, text: t }) });
      const d = (await r.json()) as { replies?: Omit<Msg, "from">[] };
      if (Array.isArray(d?.replies)) replies = d.replies.map((x) => ({ ...x, text: String(x?.text ?? "") }));
    } catch {}
    setMsgs((m) => [...m, ...replies.map((x) => ({ from: "bot" as const, ...x }))]);
  }

  const last = msgs[msgs.length - 1];
  return (
    <main>
      <h1>Chat with the bot</h1>
      <p className="sub">Same bot as Telegram, in the browser. <a href="/">Dashboard</a></p>
      <div className="chat">
        {msgs.length === 0 && <div className="bubble bot">Say hi to start.</div>}
        {msgs.map((m, i) => (
          <div key={i} className={`bubble ${m.from}`}>
            {m.text}
            {m.link && <div><a href={m.link.url}>{m.link.label} →</a></div>}
          </div>
        ))}
        {last?.from === "bot" && last.buttons && (
          <div className="btns">{last.buttons.map((b) => <button key={b} onClick={() => send(b)}>{b}</button>)}</div>
        )}
        <div ref={end} />
      </div>
      <form className="send" onSubmit={(e) => { e.preventDefault(); send(text); }}>
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Type a message" />
        <button type="submit">Send</button>
      </form>
    </main>
  );
}
