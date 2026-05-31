import Ably from "ably";

const ABLY_KEY = process.env.ABLY_KEY ?? "";
export const CHAT_CHANNEL = "bolao-chat";

let restClient: Ably.Rest | null = null;

export function getAblyRest(): Ably.Rest {
  if (!restClient) {
    restClient = new Ably.Rest(ABLY_KEY);
  }
  return restClient;
}

export async function publishChatMessage(data: unknown): Promise<void> {
  const client = getAblyRest();
  const channel = client.channels.get(CHAT_CHANNEL);
  await channel.publish("message", data);
}
