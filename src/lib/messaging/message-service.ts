import type { PrismaClient } from "@prisma/client";
import type { PublicUser } from "@/lib/auth/public-user";
import { formatEventDates } from "@/lib/events/event-window";
import { getMessageChannel } from "@/lib/messaging/channel";
import { renderMessage, type MessageTemplate } from "@/lib/messaging/templates";
import { ticketLookupWhere } from "@/lib/tickets/ticket-service";

export type SendResult = { ok: true; openUrl: string | null; text: string } | { ok: false; status: 403 | 404 | 409; message: string };

const DESK_ONLY: MessageTemplate[] = ["REGISTERED", "UNCOLLECTED_REMINDER"];

function appUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

/** Renders a template for a ticket, hands it to the channel, and logs the send on the ticket. */
export async function sendTicketMessage(prisma: PrismaClient, user: PublicUser, ticketRef: string, template: MessageTemplate): Promise<SendResult> {
  const ticket = await prisma.repairTicket.findFirst({
    where: ticketLookupWhere(ticketRef),
    select: {
      id: true,
      trackingCode: true,
      ticketId: true,
      technicianId: true,
      requester: { select: { fullName: true, phone: true } },
      device: { select: { brand: true, model: true } },
      event: { select: { venue: true, hours: true, startsOn: true, endsOn: true, holdDays: true } },
      events: { where: { eventType: "REPAIR_BLOCKED" }, orderBy: { createdAt: "desc" }, take: 1, select: { note: true } },
    },
  });
  if (!ticket || !ticket.requester) return { ok: false, status: 404, message: "Ticket not found." };

  const desk = user.role === "ADMIN" || user.role === "LEAD_TECHNICIAN";
  if (!desk && (DESK_ONLY.includes(template) || ticket.technicianId !== user.id)) return { ok: false, status: 403, message: "Only the desk or the assigned technician can send this." };

  const code = ticket.trackingCode ?? ticket.ticketId;
  const text = renderMessage(template, {
    firstName: ticket.requester.fullName.split(/\s+/)[0],
    trackingCode: code,
    device: `${ticket.device.brand} ${ticket.device.model}`,
    venue: ticket.event.venue,
    hours: ticket.event.hours,
    dates: formatEventDates(ticket.event.startsOn, ticket.event.endsOn),
    holdDays: ticket.event.holdDays,
    trackUrl: `${appUrl()}/track?code=${encodeURIComponent(code)}`,
    detail: ticket.events[0]?.note ?? null,
  });

  const channel = getMessageChannel();
  const { openUrl } = await channel.deliver(ticket.requester.phone, text);

  await prisma.repairEvent.create({
    data: {
      ticketId: ticket.id,
      actorId: user.id,
      actorRole: user.role,
      eventType: "MESSAGE_SENT",
      note: `WhatsApp: ${template.toLowerCase().replaceAll("_", " ")}`,
      metadata: { template, channel: channel.name, languages: "so+en" },
    },
  });

  return { ok: true, openUrl, text };
}
