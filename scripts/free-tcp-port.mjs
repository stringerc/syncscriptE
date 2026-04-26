#!/usr/bin/env node
/**
 * Prints an ephemeral free TCP port on 127.0.0.1 (stdout only).
 * Used by verify:console-errors so Playwright's vite preview does not collide
 * with an already-running preview on a fixed port.
 */
import net from 'node:net';

const server = net.createServer();
server.listen(0, '127.0.0.1', () => {
  const addr = server.address();
  const port = typeof addr === 'object' && addr ? addr.port : 0;
  server.close(() => {
    process.stdout.write(String(port));
    process.exit(0);
  });
});

server.on('error', (err) => {
  console.error(err);
  process.exit(1);
});
