"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const router = express_1.default.Router();
router.get('/', (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader)
        return res.sendStatus(401);
    try {
        const token = authHeader.split(' ')[1];
        const decoded = jsonwebtoken_1.default.verify(token, process.env.SESSION_SECRET);
        res.json({ message: 'Welcome to the dashboard', user: decoded });
    }
    catch (e) {
        res.sendStatus(403);
    }
});
exports.default = router;
