"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generate_unique_reference = void 0;
const generate_unique_reference = () => {
    return `txn_${Date.now()}_${Math.floor(Math.random() * 1000000)}`;
};
exports.generate_unique_reference = generate_unique_reference;
