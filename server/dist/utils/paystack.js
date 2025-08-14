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
exports.verify_paystack_transaction = exports.initialize_paystack_transaction = void 0;
const axios_1 = __importDefault(require("axios"));
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const paystack_api = axios_1.default.create({
    baseURL: "https://api.paystack.co",
    headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
    },
});
const initialize_paystack_transaction = (_a) => __awaiter(void 0, [_a], void 0, function* ({ email, amount, reference, }) {
    const { data } = yield paystack_api.post("/transaction/initialize", {
        email,
        amount: amount * 100, // Paystack expects amount in kobo
        reference,
    });
    return data.data; // contains authorization_url, access_code, reference
});
exports.initialize_paystack_transaction = initialize_paystack_transaction;
const verify_paystack_transaction = (reference) => __awaiter(void 0, void 0, void 0, function* () {
    const { data } = yield paystack_api.get(`/transaction/verify/${reference}`);
    return data.data; // contains status, customer, amount, etc.
});
exports.verify_paystack_transaction = verify_paystack_transaction;
