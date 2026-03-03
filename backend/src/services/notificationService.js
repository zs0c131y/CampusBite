/**
 * Server-Sent Events (SSE) notification service.
 * Manages per-user SSE connections and broadcasts payloads to connected clients.
 * Supports multiple simultaneous connections per user (multi-tab).
 */

/** @type {Map<string, Set<import('express').Response>>} */
const clients = new Map();

/**
 * Register a response stream for a user.
 * @param {string} userId
 * @param {import('express').Response} res
 */
export const addClient = (userId, res) => {
  const uid = String(userId);
  if (!clients.has(uid)) clients.set(uid, new Set());
  clients.get(uid).add(res);
};

/**
 * Remove a response stream for a user.
 * @param {string} userId
 * @param {import('express').Response} res
 */
export const removeClient = (userId, res) => {
  const uid = String(userId);
  const set = clients.get(uid);
  if (!set) return;
  set.delete(res);
  if (set.size === 0) clients.delete(uid);
};

/**
 * Push a notification payload to all active connections for a user.
 * Returns true if at least one connection received the event.
 * @param {string} userId
 * @param {{ type: string, title: string, message: string, data?: object }} payload
 * @returns {boolean}
 */
export const sendNotification = (userId, payload) => {
  const uid = String(userId);
  const set = clients.get(uid);
  if (!set || set.size === 0) return false;

  const event = JSON.stringify({
    ...payload,
    timestamp: new Date().toISOString(),
  });
  let sent = false;

  for (const res of set) {
    try {
      res.write(`data: ${event}\n\n`);
      sent = true;
    } catch {
      // Client disconnected; cleanup happens via the 'close' handler
    }
  }

  return sent;
};

/** Number of currently connected clients (for diagnostics). */
export const getConnectedClientCount = () => {
  let count = 0;
  for (const set of clients.values()) count += set.size;
  return count;
};
