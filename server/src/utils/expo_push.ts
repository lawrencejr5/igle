import { Expo } from "expo-server-sdk";
import mongoose from "mongoose";
import User from "../models/user"; // Import your User model

// Create a new Expo SDK client
const expo = new Expo();

export const sendNotification = async (
  targetIdentifiers: string[],
  title: string,
  body: string,
  data: any = {},
) => {
  try {
    if (!targetIdentifiers || targetIdentifiers.length === 0) return;

    const userIds: string[] = [];
    const directTokens: string[] = [];

    // Separate User ObjectIds from direct Expo Push Tokens
    for (const item of targetIdentifiers) {
      if (!item) continue;
      if (
        typeof item === "string" &&
        (item.startsWith("ExponentPushToken[") || item.startsWith("ExpoPushToken["))
      ) {
        directTokens.push(item);
      } else if (mongoose.Types.ObjectId.isValid(item)) {
        userIds.push(item);
      }
    }

    let messages: any[] = [];
    const tokenToUserMap: Record<string, string> = {};

    // 1. Fetch tokens for User IDs
    if (userIds.length > 0) {
      const users = await User.find({ _id: { $in: userIds } });

      for (let user of users) {
        if (!user.expo_push_tokens || user.expo_push_tokens.length === 0)
          continue;

        for (let token of user.expo_push_tokens) {
          if (!Expo.isExpoPushToken(token)) {
            console.error(`Push token ${token} is not a valid Expo push token`);
            continue;
          }

          tokenToUserMap[token] = user._id!.toString();

          messages.push({
            to: token,
            sound: "push_alert.wav",
            title: title,
            body: body,
            data: data,
            channelId: "igle_ride",
          });
        }
      }
    }

    // 2. Add direct Push Tokens
    for (let token of directTokens) {
      if (!Expo.isExpoPushToken(token)) {
        console.error(`Direct push token ${token} is not a valid Expo push token`);
        continue;
      }

      messages.push({
        to: token,
        sound: "push_alert.wav",
        title: title,
        body: body,
        data: data,
        channelId: "igle_ride",
      });
    }

    // Return early if no messages to send
    if (messages.length === 0) return;

    // 3. Chunk and Send (Expo requires batching)
    let chunks = expo.chunkPushNotifications(messages);
    let tickets = [];

    for (let chunk of chunks) {
      try {
        let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);

        // 👇👇 CLEANUP LOGIC: Remove dead tokens immediately 👇👇
        for (let i = 0; i < ticketChunk.length; i++) {
          const ticket = ticketChunk[i];

          if (ticket.status === "error") {
            if (
              ticket.details &&
              ticket.details.error === "DeviceNotRegistered"
            ) {
              const badToken = chunk[i].to as string;
              const userId = tokenToUserMap[badToken];

              if (userId) {
                console.log(
                  `Removing dead token: ${badToken} for user ${userId}`,
                );
                await User.findByIdAndUpdate(userId, {
                  $pull: { expo_push_tokens: badToken },
                });
              }
            }
          }
        }
        // 👆👆 END CLEANUP LOGIC 👆👆
      } catch (error) {
        console.error("Error sending chunk", error);
      }
    }

    return tickets;
  } catch (error) {
    console.error("Error in sendNotification:", error);
  }
};
