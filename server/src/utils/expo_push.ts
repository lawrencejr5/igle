import { Expo } from "expo-server-sdk";
import User from "../models/user";

const expo = new Expo();

/**
 * Send Expo push notifications to a list of push tokens.
 * Filters invalid tokens, chunks messages, sends them, logs ticket chunks,
 * fetches receipts and prunes invalid tokens automatically.
 */
export const sendExpoPush = async (
  tokens: string[],
  title: string,
  body: string,
  data: Record<string, any> = {}
) => {
  if (!tokens || tokens.length === 0) return { success: 0, failed: 0 };

  const messages: any[] = [];
  const tokenMap: string[] = []; // parallel to messages

  for (const pushToken of tokens) {
    if (!Expo.isExpoPushToken(pushToken)) {
      console.warn("[expo_push] Skipping non-Expo token:", pushToken);
      continue;
    }
    messages.push({
      to: pushToken,
      sound: "default",
      title,
      body,
      data,
    });
    tokenMap.push(pushToken);
  }

  console.log(`[expo_push] Sending ${messages.length} messages`);

  if (messages.length === 0) {
    return { success: 0, failed: tokens.length };
  }

  const chunks = expo.chunkPushNotifications(messages);
  const tickets: any[] = [];
  const ticketToToken: Record<string, string> = {};
  let tokenIndex = 0;

  for (const chunk of chunks) {
    try {
      const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      console.log("[expo_push] Ticket chunk:", JSON.stringify(ticketChunk));
      ticketChunk.forEach((ticket: any) => {
        tickets.push(ticket);
        if (ticket.id) {
          // map ticket id to the original token (tokenMap order matches messages order)
          ticketToToken[ticket.id] = tokenMap[tokenIndex] || "unknown";
        }
        tokenIndex++;
      });
    } catch (err) {
      console.error("[expo_push] Error sending push chunk:", err);
    }
  }

  // Collect receipt ids
  const receiptIds = tickets.filter((t) => t && t.id).map((t) => t.id);

  if (receiptIds.length > 0) {
    const receiptIdChunks = expo.chunkPushNotificationReceiptIds(receiptIds);
    for (const chunk of receiptIdChunks) {
      try {
        const receipts = await expo.getPushNotificationReceiptsAsync(chunk);
        console.log("[expo_push] Receipts chunk:", JSON.stringify(receipts));
        for (const receiptId of Object.keys(receipts)) {
          const receipt = (receipts as any)[receiptId];
          const token = ticketToToken[receiptId];
          if (receipt.status === "error") {
            console.error(
              "[expo_push] Receipt error for token:",
              token,
              receipt
            );
            const err = receipt.details?.error?.toString?.() || "";
            const errLower = err.toLowerCase();
            if (
              errLower.includes("device_not_registered") ||
              errLower.includes("not_registered") ||
              errLower.includes("invalid_credentials")
            ) {
              console.log("[expo_push] Removing invalid token:", token);
              try {
                await cleanupInvalidToken(token);
              } catch (e) {
                console.error("[expo_push] Failed to cleanup token:", token, e);
              }
            }
          }
        }
      } catch (err) {
        console.error("[expo_push] Error fetching receipts:", err);
      }
    }
  }

  const success = tickets.filter((t) => t && t.status === "ok").length;
  const failed = tickets.length - success;
  console.log(
    `[expo_push] Push send summary: success=${success}, failed=${failed}`
  );

  return { success, failed };
};

/**
 * Remove a specific token from all users.
 */
export const cleanupInvalidToken = async (token: string) => {
  try {
    const res = await User.updateMany(
      { expo_push_tokens: token },
      { $pull: { expo_push_tokens: token } }
    );
    console.log("[expo_push] cleanupInvalidToken result:", res);
    return res;
  } catch (err) {
    console.error("[expo_push] cleanupInvalidToken error:", err);
    throw err;
  }
};
