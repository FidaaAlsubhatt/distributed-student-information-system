"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.comparePasswords = exports.hashPassword = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const hashPassword = (pwd) => bcrypt_1.default.hash(pwd, 10);
exports.hashPassword = hashPassword;
const comparePasswords = (pwd, hash) => bcrypt_1.default.compare(pwd, hash);
exports.comparePasswords = comparePasswords;
