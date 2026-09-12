"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendNotification = void 0;
const expo_server_sdk_1 = require("expo-server-sdk");
const mongoose_1 = __importDefault(require("mongoose"));
const user_1 = __importDefault(require("../models/user")); // Import your User model
// Create a new Expo SDK client
const expo = new expo_server_sdk_1.Expo();
const sendNotification = (targetIdentifiers_1, title_1, body_1, ...args_1) => __awaiter(void 0, [targetIdentifiers_1, title_1, body_1, ...args_1], void 0, function* (targetIdentifiers, title, body, data = {}) {
    try {
        if (!targetIdentifiers || targetIdentifiers.length === 0)
            return;
        const userIds = [];
        const directTokens = [];
        // Separate User ObjectIds from direct Expo Push Tokens
        for (const item of targetIdentifiers) {
            if (!item)
                continue;
            if (typeof item === "string" &&
                (item.startsWith("ExponentPushToken[") || item.startsWith("ExpoPushToken["))) {
                directTokens.push(item);
            }
            else if (mongoose_1.default.Types.ObjectId.isValid(item)) {
                userIds.push(item);
            }
        }
        let messages = [];
        const tokenToUserMap = {};
        // 1. Fetch tokens for User IDs
        if (userIds.length > 0) {
            const users = yield user_1.default.find({ _id: { $in: userIds } });
            for (let user of users) {
                if (!user.expo_push_tokens || user.expo_push_tokens.length === 0)
                    continue;
                for (let token of user.expo_push_tokens) {
                    if (!expo_server_sdk_1.Expo.isExpoPushToken(token)) {
                        console.error(`Push token ${token} is not a valid Expo push token`);
                        continue;
                    }
                    tokenToUserMap[token] = user._id.toString();
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
            if (!expo_server_sdk_1.Expo.isExpoPushToken(token)) {
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
        if (messages.length === 0)
            return;
        // 3. Chunk and Send (Expo requires batching)
        let chunks = expo.chunkPushNotifications(messages);
        let tickets = [];
        for (let chunk of chunks) {
            try {
                let ticketChunk = yield expo.sendPushNotificationsAsync(chunk);
                tickets.push(...ticketChunk);
                // 👇👇 CLEANUP LOGIC: Remove dead tokens immediately 👇👇
                for (let i = 0; i < ticketChunk.length; i++) {
                    const ticket = ticketChunk[i];
                    if (ticket.status === "error") {
                        if (ticket.details &&
                            ticket.details.error === "DeviceNotRegistered") {
                            const badToken = chunk[i].to;
                            const userId = tokenToUserMap[badToken];
                            if (userId) {
                                console.log(`Removing dead token: ${badToken} for user ${userId}`);
                                yield user_1.default.findByIdAndUpdate(userId, {
                                    $pull: { expo_push_tokens: badToken },
                                });
                            }
                        }
                    }
                }
                // 👆👆 END CLEANUP LOGIC 👆👆
            }
            catch (error) {
                console.error("Error sending chunk", error);
            }
        }
        return tickets;
    }
    catch (error) {
        console.error("Error in sendNotification:", error);
    }
});
exports.sendNotification = sendNotification;
