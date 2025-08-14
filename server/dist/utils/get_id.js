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
exports.get_driver_socket_id = exports.get_user_socket_id = exports.get_driver_id = void 0;
const driver_1 = __importDefault(require("../models/driver"));
const user_1 = __importDefault(require("../models/user"));
const get_driver_id = (user_id) => __awaiter(void 0, void 0, void 0, function* () {
    const driver = yield driver_1.default.findOne({ user: user_id });
    return driver === null || driver === void 0 ? void 0 : driver._id;
});
exports.get_driver_id = get_driver_id;
const get_user_socket_id = (user_id) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_1.default.findById(user_id);
    return user === null || user === void 0 ? void 0 : user.socket_id;
});
exports.get_user_socket_id = get_user_socket_id;
const get_driver_socket_id = (user_id) => __awaiter(void 0, void 0, void 0, function* () {
    const driver = yield driver_1.default.findById(user_id);
    return driver === null || driver === void 0 ? void 0 : driver.socket_id;
});
exports.get_driver_socket_id = get_driver_socket_id;
