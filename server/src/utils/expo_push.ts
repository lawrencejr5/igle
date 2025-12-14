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

    // Helper map to track which user owns which token (for cleanup later)
    const tokenToUserMap: Record<string, string> = {};

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

        // Map token to userId so we can remove it if it turns out to be dead
        tokenToUserMap[token] = user._id!.toString();

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

          // If Expo says there was an error delivery...
          if (ticket.status === "error") {
            // Check specifically if the device is no longer registered (App Uninstalled)
            if (
              ticket.details &&
              ticket.details.error === "DeviceNotRegistered"
            ) {
              const badToken = chunk[i].to as string;
              const userId = tokenToUserMap[badToken];

              if (userId) {
                console.log(
                  `Removing dead token: ${badToken} for user ${userId}`
                );
                // Remove the bad token from the specific user's array
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

    // Optional: You can return 'tickets' if you want to track success/failure
    return tickets;
  } catch (error) {
    console.error("Error in sendNotification:", error);
  }
};
