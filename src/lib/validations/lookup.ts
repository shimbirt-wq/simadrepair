import { z } from "zod";

export const ticketLookupSchema = z.object({
  ticketId: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^TCK-[A-Z0-9-]{4,40}$/, "Ticket ID format is invalid"),
});

export type TicketLookupInput = z.infer<typeof ticketLookupSchema>;
