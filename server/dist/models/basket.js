"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const BasketSchema = new mongoose_1.Schema({
    user: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    restaurant: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Restaurant",
        required: true,
    },
    items: [
        {
            menu_item: {
                type: mongoose_1.Schema.Types.ObjectId,
                ref: "MenuItem",
                required: true,
            },
            quantity: { type: Number, required: true, min: 1, default: 1 },
            unit_price: { type: Number, required: true, min: 0 },
            selected_options: [
                {
                    group_name: { type: String, required: true },
                    option_name: { type: String, required: true },
                    price_modifier: { type: Number, default: 0 },
                },
            ],
            special_instructions: { type: String, default: "" },
            item_total: { type: Number, required: true, min: 0 },
        },
    ],
    subtotal: { type: Number, required: true, default: 0 },
}, { timestamps: true });
// Compound unique index: user can have one basket per restaurant
BasketSchema.index({ user: 1, restaurant: 1 }, { unique: true });
exports.default = mongoose_1.default.model("Basket", BasketSchema);
