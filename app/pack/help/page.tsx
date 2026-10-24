import Link from "next/link";
import { Icon, Shell } from "../ui";

// Help routes back to the chat, where a person picks it up.
export default function Help() {
  return (
    <Shell title="Get help" sub="A person will pick this up" back>
      <div className="pk-card">
        <h2>Message us in the bot</h2>
        <p className="pk-mut">Say what you need in your own words. Ana Reyes, your Visayas organizer, usually replies within a day. Your church's pastor answers pastoral questions.</p>
        <p className="pk-mut">Opened this from Telegram? Close the starter pack and type in the chat.</p>
        <Link className="pk-btn2" href="/chat"><Icon name="send" size={18} />Use the web chat instead</Link>
      </div>
      <div className="pk-card">
        <h2>Urgent on event day</h2>
        <p className="pk-mut">Call local emergency services first. Then tell the bot so we can help with what comes next.</p>
      </div>
    </Shell>
  );
}
