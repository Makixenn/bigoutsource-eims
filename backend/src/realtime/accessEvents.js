let io = null;

function userRoom(userId) {
  return `user:${userId}`;
}

export function setRealtimeServer(server) {
  io = server;
}

export function emitUserAccessUpdated(userId, user, reason = 'access.updated') {
  if (!io || !userId) return;

  io.to(userRoom(userId)).emit('access:updated', {
    reason,
    user,
    emittedAt: new Date().toISOString(),
  });
}

export function emitUserAccessRevoked(userId, reason = 'access.revoked') {
  if (!io || !userId) return;

  io.to(userRoom(userId)).emit('access:revoked', {
    reason,
    emittedAt: new Date().toISOString(),
  });

  setTimeout(() => {
    io?.in(userRoom(userId)).disconnectSockets(true);
  }, 250);
}

export function emitTableChange(table, action = 'UPDATE', payload = {}) {
  if (!io) return;
  io.emit('db_change', {
    table,
    action,
    payload,
    emittedAt: new Date().toISOString(),
  });
}

export function emitSessionOverride(userId) {
  if (!io || !userId) return;
  io.to(userRoom(userId)).emit('session:override');
}
