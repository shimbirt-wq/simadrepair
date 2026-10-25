import { whatsappLink } from "@/lib/phone";

/**
 * How a message reaches the requester. Today staff send it themselves from
 * a pre-filled WhatsApp link; a WhatsApp Cloud API channel can implement the
 * same interface later without changing callers.
 */
export type MessageChannel = {
  name: "whatsapp_link" | "whatsapp_cloud_api";
  /** Returns a link for the staff member to open, or null when the channel sent it already. */
  deliver(to: string, text: string): Promise<{ openUrl: string | null }>;
};

export const whatsappLinkChannel: MessageChannel = {
  name: "whatsapp_link",
  async deliver(to, text) {
    return { openUrl: whatsappLink(to, text) };
  },
};

export function getMessageChannel(): MessageChannel {
  return whatsappLinkChannel;
}
