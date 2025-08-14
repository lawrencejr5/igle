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
exports.get_user_transactions = void 0;
const wallet_1 = __importDefault(require("../models/wallet"));
const transaction_1 = __importDefault(require("../models/transaction"));
const get_user_transactions = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const owner_id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const wallet = yield wallet_1.default.findOne({ owner_id });
        if (!wallet) {
            return res.status(404).json({ message: "Wallet not found" });
        }
        const transactions = yield transaction_1.default.find({ wallet_id: wallet._id }).sort({ createdAt: -1 });
        res
            .status(200)
            .json({ msg: "success", row_count: transactions.length, transactions });
    }
    catch (error) {
        res.status(500).json({ message: "Could not fetch transactions", error });
    }
});
exports.get_user_transactions = get_user_transactions;
