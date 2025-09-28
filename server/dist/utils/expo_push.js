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
exports.cleanupInvalidToken = exports.sendExpoPush = void 0;
const expo_server_sdk_1 = require("expo-server-sdk");
const user_1 = __importDefault(require("../models/user"));
const expo = new expo_server_sdk_1.Expo();
/**
 * Send Expo push notifications to a list of push tokens.
 * Filters invalid tokens, chunks messages, and attempts to fetch receipts to
 * detect and optionally prune bad tokens.
 */
const sendExpoPush = (tokens_1, title_1, body_1, ...args_1) => __awaiter(void 0, [tokens_1, title_1, body_1, ...args_1], void 0, function* (tokens, title, body, data = {}) {
    if (!tokens || tokens.length === 0)
        return { success: 0, failed: 0 };
    const messages = [];
    for (const pushToken of tokens) {
        if (!expo_server_sdk_1.Expo.isExpoPushToken(pushToken)) {
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
    const tickets = [];
    for (const chunk of chunks) {
        try {
            const ticketChunk = yield expo.sendPushNotificationsAsync(chunk);
            tickets.push(...ticketChunk);
            // count success/fail by status
            for (const t of ticketChunk) {
                if (t.status === "ok")
                    success += 1;
                else
                    failed += 1;
            }
        }
        catch (err) {
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
                const receipts = yield expo.getPushNotificationReceiptsAsync(rchis);
                for (const receiptId in receipts) {
                    const receipt = receipts[receiptId];
                    if (receipt.status === "error") {
                        console.error(`Push error for receipt ${receiptId}:`, receipt.message, receipt.details);
                        // If details indicate an invalid token, attempt to remove it
                        const details = receipt.details || {};
                        if (details.error === "DeviceNotRegistered" ||
                            details.error === "InvalidCredentials") {
                            // details may not include token; best-effort: log for manual pruning
                            console.warn("Receipt indicates unregistered/invalid token.");
                        }
                    }
                }
            }
            catch (err) {
                console.error("Failed to get push receipts:", err);
            }
        }
    }
    catch (err) {
        console.error("Error while processing push ticket receipts:", err);
    }
    return { success, failed };
});
exports.sendExpoPush = sendExpoPush;
/**
 * Helper to remove a specific token from all users.
 * Use when you discover an invalid token and want to cleanup.
 */
const cleanupInvalidToken = (token) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield user_1.default.updateMany({}, { $pull: { expo_push_tokens: token } });
        return true;
    }
    catch (err) {
        console.error("Failed to cleanup invalid token:", err);
        return false;
    }
});
exports.cleanupInvalidToken = cleanupInvalidToken;
