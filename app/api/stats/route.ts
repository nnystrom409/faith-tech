import { listChurches, listUsers, listActivity, storeKind } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const [churches, users, activity] = await Promise.all([listChurches(), listUsers(), listActivity()]);
  churches.sort((a, b) => b.registeredAt.localeCompare(a.registeredAt));
  return Response.json({
    store: storeKind,
    totals: {
      contacts: users.length,
      optedIn: users.filter((u) => u.consentAt && u.step !== "stopped").length,
      optedOut: users.filter((u) => u.step === "stopped").length,
      churches: churches.length,
      reported: churches.filter((c) => c.baptisms !== undefined).length,
      baptisms: churches.reduce((s, c) => s + (c.baptisms ?? 0), 0),
      flagged: churches.filter((c) => c.possibleDuplicateOf).length,
    },
    churches,
    activity,
  });
}
