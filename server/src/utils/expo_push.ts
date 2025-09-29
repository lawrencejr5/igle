import { Expo } from "expo-server-sdk";
import User from "../models/user";

const expo = new Expo();

/**
 * Send Expo push notifications to a list of push tokens.
 * Filters invalid tokens, chunks messages, and attempts to fetch receipts to
 * detect and optionally prune bad tokens.
 */

export const sendExpoPush = async (
  tokens: string[],
  title: string,
  body: string,
  data: Record<string, any> = {}
) => {
  if (!tokens || tokens.length === 0) return { success: 0, failed: 0 };

  const messages: any[] = [];
  for (const pushToken of tokens) {
    if (!Expo.isExpoPushToken(pushToken)) {
      console.warn("Skipping non-Expo token:", pushToken);
      continue;
    }
    messages.push({
      to: pushToken,
      sound: "default",
      title,
      body,
      data,
    });
  }

  const chunks = expo.chunkPushNotifications(messages);
  let success = 0;
  let failed = 0;

  const tickets: any[] = [];
  for (const chunk of chunks) {
    try {
      const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      tickets.push(...ticketChunk);
      // count success/fail by status
      for (const t of ticketChunk) {
        if (t.status === "ok") success += 1;
        else failed += 1;
      }
    } catch (err) {
      console.error("Error sending push notifications chunk:", err);
      failed += chunk.length;
    }
  }

  // Attempt to fetch receipts to identify invalid tokens and prune them
  try {
    const receiptIds = tickets.map((t) => t.id).filter((id) => !!id);
    const receiptIdChunks = expo.chunkPushNotificationReceiptIds(receiptIds);
    for (const rchis of receiptIdChunks) {
      try {
        const receipts = await expo.getPushNotificationReceiptsAsync(rchis);
        for (const receiptId in receipts) {
          const receipt = receipts[receiptId];
          if (receipt.status === "error") {
            console.error(
              `Push error for receipt ${receiptId}:`,
              receipt.message,
              receipt.details
            );
            // If details indicate an invalid token, attempt to remove it
            const details = receipt.details || {};
            if (
              details.error === "DeviceNotRegistered" ||
              details.error === "InvalidCredentials"
            ) {
              // details may not include token; best-effort: log for manual pruning
              console.warn("Receipt indicates unregistered/invalid token.");
            }
          }
        }
      } catch (err) {
        console.error("Failed to get push receipts:", err);
      }
    }
  } catch (err) {
    console.error("Error while processing push ticket receipts:", err);
  }

  return { success, failed };
};

/**
 * Helper to remove a specific token from all users.
 * Use when you discover an invalid token and want to cleanup.
 */
export const cleanupInvalidToken = async (token: string) => {
  try {
    await User.updateMany({}, { $pull: { expo_push_tokens: token } });
    return true;
  } catch (err) {
    console.error("Failed to cleanup invalid token:", err);
    return false;
  }
};
