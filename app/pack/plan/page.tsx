import { getReadiness, READINESS_ITEMS, statusOf, verifyChurch, type ItemStatus } from "@/lib/readiness";
import { getChurch } from "@/lib/store";
import PlanClient from "./PlanClient";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<Record<string, string | undefined>> };

const items = READINESS_ITEMS.map((i) => ({ key: i.key, label: i.en, hint: i.hint, essential: i.essential }));

// Demo state for visitors without a church link (matches the design's test church).
const DEMO: Record<string, ItemStatus> = {
  venue: "not_yet", lead: "complete", volunteers: "complete", access: "not_yet", water: "complete",
  prep: "complete", reporting: "complete", followup: "need_help", emergency: "not_yet",
};

export default async function Plan({ searchParams }: Props) {
  const { c, k } = await searchParams;
  if (!verifyChurch(c, k)) return <PlanClient items={items} initial={DEMO} churchName="Grace Fellowship" />;

  const [church, r] = await Promise.all([getChurch(c), getReadiness(c)]);
  const initial = Object.fromEntries(READINESS_ITEMS.map((i) => [i.key, statusOf(r, i.key)]));
  return <PlanClient items={items} initial={initial} churchName={church?.name ?? "Your church"} link={{ c, k: k! }} />;
}
