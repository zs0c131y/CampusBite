import { Router } from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { formatUser } from "../utils/formatters.js";
import { addClient, removeClient } from "../services/notificationService.js";

const router = Router();

/**
 * GET /api/notifications/subscribe
 *
 * Server-Sent Events endpoint. Authenticates via ?token= query param since
 * the browser's EventSource API cannot set custom request headers.
 */
router.get("/subscribe", async (req, res) => {
  const token = req.query.token;

  if (!token) {
    return res.status(401).json({ success: false, message: "Token required." });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return res
      .status(401)
      .json({ success: false, message: "Invalid or expired token." });
  }

  const userDoc = await User.findById(decoded.userId).lean();
  if (!userDoc) {
    return res.status(401).json({ success: false, message: "User not found." });
  }

  const user = formatUser(userDoc);
  const userId = user.id;

  // SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no"); // disable nginx buffering
  res.flushHeaders();

  // Initial handshake event
  res.write(
    `data: ${JSON.stringify({ type: "connected", message: "Notification stream connected." })}\n\n`,
  );

  addClient(userId, res);

  // Heartbeat every 25 s to keep the connection alive through proxies
  const heartbeat = setInterval(() => {
    try {
      res.write(": heartbeat\n\n");
    } catch {
      clearInterval(heartbeat);
    }
  }, 25_000);

  req.on("close", () => {
    clearInterval(heartbeat);
    removeClient(userId, res);
  });
});

export default router;
