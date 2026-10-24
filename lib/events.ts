// Test baptism events for "Find a baptism near me". Only events whose host
// church agreed to be listed are shown, and no contact details are ever shared:
// interest goes to organizers, who connect the person with the church.
export type BaptismEvent = { id: string; church: string; city: string; area: string; when: string; listed: boolean };

export const EVENTS: BaptismEvent[] = [
  { id: "ev1", church: "Harbor Light Church", city: "Santa Monica", area: "Los Angeles", when: "Pentecost Sun, May 16 · 10:00 AM · Santa Monica beach", listed: true },
  { id: "ev2", church: "Grace Community LA", city: "Los Angeles", area: "Los Angeles", when: "Pentecost Sun, May 16 · 1:00 PM", listed: true },
  { id: "ev3", church: "Iglesia Nueva Vida", city: "Long Beach", area: "Los Angeles", when: "Domingo de Pentecostés, 16 de mayo · 11:00 AM", listed: true },
  { id: "ev4", church: "Cornerstone Irvine", city: "Irvine", area: "Orange County", when: "Pentecost Sun, May 16 · 9:30 AM", listed: true },
  { id: "ev5", church: "Bayside Fellowship", city: "San Diego", area: "San Diego", when: "Pentecost Sun, May 16 · 4:00 PM · Mission Bay", listed: true },
  { id: "ev6", church: "Valley Chapel", city: "Fresno", area: "Central Valley", when: "Pentecost Sun, May 16 · 10:30 AM", listed: false },
  { id: "ev7", church: "Grace Fellowship", city: "Tacloban", area: "Leyte", when: "Pentecost Sun, May 16 · 8:00 AM", listed: true },
  { id: "ev8", church: "Luz del Valle", city: "Cusco", area: "Cusco", when: "Domingo de Pentecostés, 16 de mayo · 10:00 AM", listed: true },
];

const n = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z ]/g, " ").replace(/\s+/g, " ").trim();
const ALIASES: Record<string, string> = { la: "los angeles", sd: "san diego", oc: "orange county", "santa monica ca": "santa monica" };

// Same city first, then the same wider area.
export function findNear(place: string): BaptismEvent[] {
  const q = ALIASES[n(place)] ?? n(place);
  if (q.length < 2) return [];
  const listed = EVENTS.filter((e) => e.listed);
  const city = listed.filter((e) => n(e.city).includes(q) || q.includes(n(e.city)));
  const area = city.length ? listed.filter((e) => n(e.area) === n(city[0].area)) : listed.filter((e) => n(e.area).includes(q) || q.includes(n(e.area)));
  return [...new Map([...city, ...area].map((e) => [e.id, e])).values()].slice(0, 3);
}
