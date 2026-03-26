import { spawn } from "node:child_process";
import net from "node:net";
import { setTimeout as delay } from "node:timers/promises";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const electronPath = require("electron");
const vitePort = 5173;
const viteHost = "127.0.0.1";
const viteUrl = `http://${viteHost}:${vitePort}`;
const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";

function spawnProcess(command, args, options = {}) {
  const child = spawn(command, args, {
    stdio: "inherit",
    shell: false,
    ...options,
  });

  child.on("exit", (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }

    if (code && code !== 0) {
      process.exit(code);
    }
  });

  return child;
}

async function waitForPort(host, port) {
  for (;;) {
    const ready = await new Promise((resolve) => {
      const socket = net.createConnection({ host, port });

      socket.once("connect", () => {
        socket.end();
        resolve(true);
      });

      socket.once("error", () => {
        resolve(false);
      });
    });

    if (ready) {
      return;
    }

    await delay(200);
  }
}

const vite = spawnProcess(npmCmd, ["run", "dev:web", "--", "--host", viteHost, "--port", String(vitePort)]);

process.env.VITE_DEV_SERVER_URL = viteUrl;

await waitForPort(viteHost, vitePort);

const electron = spawnProcess(electronPath, ["."]);

const shutdown = () => {
  vite.kill();
  electron.kill();
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
process.on("exit", shutdown);

electron.on("exit", (code, signal) => {
  vite.kill();

  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});

vite.on("exit", (code, signal) => {
  electron.kill();

  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});
