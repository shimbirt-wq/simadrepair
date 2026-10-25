/**
 * Ready-made WhatsApp messages, Somali first then English (D9, Q23).
 * Pure: the same inputs always give the same text.
 */

export const MESSAGE_TEMPLATES = ["REGISTERED", "ACTION_NEEDED", "WAITING_FOR_PARTS", "READY_FOR_PICKUP", "UNCOLLECTED_REMINDER"] as const;
export type MessageTemplate = (typeof MESSAGE_TEMPLATES)[number];

export const TEMPLATE_LABELS: Record<MessageTemplate, string> = {
  REGISTERED: "Registered — tracking code",
  ACTION_NEEDED: "Action needed",
  WAITING_FOR_PARTS: "Waiting for parts",
  READY_FOR_PICKUP: "Ready for pickup",
  UNCOLLECTED_REMINDER: "Uncollected reminder",
};

export type MessageContext = {
  firstName: string;
  trackingCode: string;
  device: string;
  venue: string;
  hours: string;
  dates: string;
  holdDays: number;
  trackUrl: string;
  /** What the student must do or buy (action needed / parts). */
  detail?: string | null;
};

const render: Record<MessageTemplate, (c: MessageContext) => { so: string; en: string }> = {
  REGISTERED: (c) => ({
    so: `Salaan ${c.firstName}, codsigaaga dayactirka SIMAD IT waa la diiwaangeliyey. Koodhka: ${c.trackingCode}. Keen ${c.device}-kaaga ${c.venue}, ${c.hours} (${c.dates}), adigoo wata kaarka aqoonsiga jaamacadda iyo charger-ka. La soco: ${c.trackUrl}`,
    en: `Hello ${c.firstName}, your SIMAD IT repair request is registered. Code: ${c.trackingCode}. Bring your ${c.device} to ${c.venue}, ${c.hours} (${c.dates}) with your university ID card and charger. Track it: ${c.trackUrl}`,
  }),
  ACTION_NEEDED: (c) => ({
    so: `Salaan ${c.firstName}, si aan u sii wadno dayactirka ${c.device} (${c.trackingCode}) waxaan kaa rabnaa: ${c.detail ?? "-"}. Fadlan nagu soo jawaab.`,
    en: `Hello ${c.firstName}, to continue repairing your ${c.device} (${c.trackingCode}) we need: ${c.detail ?? "-"}. Please reply to this message.`,
  }),
  WAITING_FOR_PARTS: (c) => ({
    so: `Salaan ${c.firstName}, ${c.device} (${c.trackingCode}) waxay u baahan tahay qayb: ${c.detail ?? "-"}. Fadlan iibso oo keen ${c.venue}, ${c.hours}.`,
    en: `Hello ${c.firstName}, your ${c.device} (${c.trackingCode}) needs a part: ${c.detail ?? "-"}. Please buy it and bring it to ${c.venue}, ${c.hours}.`,
  }),
  READY_FOR_PICKUP: (c) => ({
    so: `Salaan ${c.firstName}, ${c.device}-kaagu (${c.trackingCode}) waa diyaar. Ka qaado ${c.venue}, ${c.hours}. Keen kaarka aqoonsiga jaamacadda.`,
    en: `Hello ${c.firstName}, your ${c.device} (${c.trackingCode}) is ready. Collect it at ${c.venue}, ${c.hours}. Bring your university ID card.`,
  }),
  UNCOLLECTED_REMINDER: (c) => ({
    so: `Salaan ${c.firstName}, ${c.device} (${c.trackingCode}) weli lama qaadan, waxaana la geeyey xafiiska IT. Fadlan ka qaado ${c.holdDays} maalmood gudahood, adigoo wata kaarka aqoonsiga jaamacadda.`,
    en: `Hello ${c.firstName}, your ${c.device} (${c.trackingCode}) has not been collected and is now at the IT office. Please collect it within ${c.holdDays} days with your university ID card.`,
  }),
};

export function renderMessage(template: MessageTemplate, context: MessageContext): string {
  const { so, en } = render[template](context);
  return `${so}\n\n${en}`;
}

/** The message that fits a ticket's current status, if any. */
export function suggestedTemplate(status: string): MessageTemplate | null {
  switch (status) {
    case "SUBMITTED":
      return "REGISTERED";
    case "ACTION_NEEDED":
      return "ACTION_NEEDED";
    case "WAITING_FOR_PARTS":
      return "WAITING_FOR_PARTS";
    case "READY_FOR_PICKUP":
      return "READY_FOR_PICKUP";
    default:
      return null;
  }
}
