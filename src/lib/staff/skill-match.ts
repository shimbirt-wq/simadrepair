/** Which skill each problem category needs (LD6): used to suggest technicians, never to auto-assign. */
const CATEGORY_SKILL: Record<string, string> = {
  NO_POWER: "Hardware",
  SCREEN: "Hardware",
  KEYBOARD_TOUCHPAD: "Hardware",
  BATTERY_CHARGING: "Hardware",
  SLOW_VIRUS: "Software/OS",
  SOFTWARE_INSTALL: "Software/OS",
  WIFI_NETWORK: "Network",
};

/** Category labels as shown on the board → skill labels they need. */
const LABEL_SKILL: Record<string, string> = {
  "Won't turn on": "Hardware",
  Screen: "Hardware",
  "Keyboard / touchpad": "Hardware",
  "Battery / charging": "Hardware",
  "Slow / virus": "Software/OS",
  "Windows / software install": "Software/OS",
  "Wi-Fi / network": "Network",
};

export function neededSkills(categories: string[]): string[] {
  return [...new Set(categories.map((category) => CATEGORY_SKILL[category] ?? LABEL_SKILL[category]).filter(Boolean))];
}

/** Matching technicians first, then by fewest open tickets, then name. */
export function rankTechnicians<T extends { name: string; openCount: number; skills: string[] }>(technicians: T[], needed: string[]): Array<T & { matches: boolean }> {
  return technicians
    .map((technician) => ({ ...technician, matches: needed.length > 0 && needed.some((skill) => technician.skills.includes(skill)) }))
    .sort((a, b) => Number(b.matches) - Number(a.matches) || a.openCount - b.openCount || a.name.localeCompare(b.name));
}
