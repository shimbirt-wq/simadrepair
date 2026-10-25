import { describe, expect, it } from "vitest";
import { MESSAGE_TEMPLATES, renderMessage, suggestedTemplate, type MessageContext } from "@/lib/messaging/templates";

const context: MessageContext = {
  firstName: "Amina",
  trackingCode: "SIM-26-K7P3QX",
  device: "HP ProBook 450",
  venue: "Main Hall, Block B",
  hours: "8:00–16:00",
  dates: "1–5 Nov 2026",
  holdDays: 30,
  trackUrl: "https://repair.simad.edu.so/track?code=SIM-26-K7P3QX",
  detail: "HP 65W charger",
};

describe("WhatsApp templates", () => {
  it.each(MESSAGE_TEMPLATES)("%s is Somali first, then English, and names the code and device", (template) => {
    const [so, en] = renderMessage(template, context).split("\n\n");
    expect(so).toMatch(/^Salaan Amina/);
    expect(en).toMatch(/^Hello Amina/);
    for (const part of [so, en]) {
      expect(part).toContain("SIM-26-K7P3QX");
      expect(part).toContain("HP ProBook 450");
    }
  });

  it("includes the part or action detail and venue where needed", () => {
    expect(renderMessage("WAITING_FOR_PARTS", context)).toContain("HP 65W charger");
    expect(renderMessage("READY_FOR_PICKUP", context)).toContain("Main Hall, Block B");
    expect(renderMessage("REGISTERED", context)).toContain(context.trackUrl);
    expect(renderMessage("UNCOLLECTED_REMINDER", context)).toContain("30");
  });

  it("suggests the message for each status", () => {
    expect(suggestedTemplate("SUBMITTED")).toBe("REGISTERED");
    expect(suggestedTemplate("READY_FOR_PICKUP")).toBe("READY_FOR_PICKUP");
    expect(suggestedTemplate("IN_REPAIR")).toBeNull();
  });
});
