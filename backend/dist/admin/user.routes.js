"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/admin/user.routes.ts
const express_1 = __importDefault(require("express"));
const auth_middleware_1 = require("../middleware/auth.middleware"); // ✅ import middleware
const router = express_1.default.Router();
router.get('/protected', auth_middleware_1.authenticate, (req, res) => {
    // ✅ TypeScript-safe check for req.user
    if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized access' });
    }
    res.json({ message: `✅ Welcome, user ${req.user.userId}` });
});
exports.default = router;
