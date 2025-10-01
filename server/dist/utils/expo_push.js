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
 * Filters invalid tokens, chunks messages, sends them, logs ticket chunks,
 * fetches receipts and prunes invalid tokens automatically.
 */
const sendExpoPush = (tokens_1, title_1, body_1, ...args_1) => __awaiter(void 0, [tokens_1, title_1, body_1, ...args_1], void 0, function* (tokens, title, body, data = {}) {
    var _a, _b, _c;
    if (!tokens || tokens.length === 0)
        return { success: 0, failed: 0 };
    const messages = [];
    const tokenMap = []; // parallel to messages
    for (const pushToken of tokens) {
        if (!expo_server_sdk_1.Expo.isExpoPushToken(pushToken)) {
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
    const tickets = [];
    const ticketToToken = {};
    let tokenIndex = 0;
    for (const chunk of chunks) {
        try {
            const ticketChunk = yield expo.sendPushNotificationsAsync(chunk);
            console.log("[expo_push] Ticket chunk:", JSON.stringify(ticketChunk));
            ticketChunk.forEach((ticket) => {
                tickets.push(ticket);
                if (ticket.id) {
                    // map ticket id to the original token (tokenMap order matches messages order)
                    ticketToToken[ticket.id] = tokenMap[tokenIndex] || "unknown";
                }
                tokenIndex++;
            });
        }
        catch (err) {
            console.error("[expo_push] Error sending push chunk:", err);
        }
    }
    // Collect receipt ids
    const receiptIds = tickets.filter((t) => t && t.id).map((t) => t.id);
    if (receiptIds.length > 0) {
        const receiptIdChunks = expo.chunkPushNotificationReceiptIds(receiptIds);
        for (const chunk of receiptIdChunks) {
            try {
                const receipts = yield expo.getPushNotificationReceiptsAsync(chunk);
                console.log("[expo_push] Receipts chunk:", JSON.stringify(receipts));
                for (const receiptId of Object.keys(receipts)) {
                    const receipt = receipts[receiptId];
                    const token = ticketToToken[receiptId];
                    if (receipt.status === "error") {
                        console.error("[expo_push] Receipt error for token:", token, receipt);
                        const err = ((_c = (_b = (_a = receipt.details) === null || _a === void 0 ? void 0 : _a.error) === null || _b === void 0 ? void 0 : _b.toString) === null || _c === void 0 ? void 0 : _c.call(_b)) || "";
                        const errLower = err.toLowerCase();
                        if (errLower.includes("device_not_registered") ||
                            errLower.includes("not_registered") ||
                            errLower.includes("invalid_credentials")) {
                            console.log("[expo_push] Removing invalid token:", token);
                            try {
                                yield (0, exports.cleanupInvalidToken)(token);
                            }
                            catch (e) {
                                console.error("[expo_push] Failed to cleanup token:", token, e);
                            }
                        }
                    }
                }
            }
            catch (err) {
                console.error("[expo_push] Error fetching receipts:", err);
            }
        }
    }
    const success = tickets.filter((t) => t && t.status === "ok").length;
    const failed = tickets.length - success;
    console.log(`[expo_push] Push send summary: success=${success}, failed=${failed}`);
    return { success, failed };
});
exports.sendExpoPush = sendExpoPush;
/**
 * Remove a specific token from all users.
 */
const cleanupInvalidToken = (token) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const res = yield user_1.default.updateMany({ expo_push_tokens: token }, { $pull: { expo_push_tokens: token } });
        console.log("[expo_push] cleanupInvalidToken result:", res);
        return res;
    }
    catch (err) {
        console.error("[expo_push] cleanupInvalidToken error:", err);
        throw err;
    }
});
exports.cleanupInvalidToken = cleanupInvalidToken;
