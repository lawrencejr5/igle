import { Expo } from "expo-server-sdk";
import User from "../models/user"; // Import your User model

// Create a new Expo SDK client
const expo = new Expo();

export const sendNotification = async (
  userIds: string[],
  title: string,
  body: string,
  data: any = {}
) => {
  try {
    // 1. Find all users involved (e.g., the passenger and driver)
    const users = await User.find({ _id: { $in: userIds } });

    let messages: any[] = [];

    // 2. Loop through each user and their tokens
    for (let user of users) {
      // Check if user has tokens
      if (!user.expo_push_tokens || user.expo_push_tokens.length === 0)
        continue;

      for (let token of user.expo_push_tokens) {
        // Check if the token is valid
        if (!Expo.isExpoPushToken(token)) {
          console.error(`Push token ${token} is not a valid Expo push token`);
          continue;
        }

        // Construct the message
        messages.push({
          to: token,
          sound: "default",
          title: title,
          body: body,
          data: data, // This data is what you use for deep linking (e.g., { rideId: "123" })
        });
      }
    }

    // 3. Chunk and Send (Expo requires batching)
    let chunks = expo.chunkPushNotifications(messages);
    let tickets = [];

    for (let chunk of chunks) {
      try {
        let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
      } catch (error) {
        console.error("Error sending chunk", error);
      }
    }

    // Optional: You can return 'tickets' if you want to track success/failure
    return tickets;
  } catch (error) {
    console.error("Error in sendNotification:", error);
  }
};
