import { redirect } from "next/navigation";

// The bot's starter pack link now opens the full portal.
export default function StarterPack() {
  redirect("/pack");
}
