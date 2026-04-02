#!/usr/bin/env node
/**
 * send-plain-text-email — dev tool for sending a plain text email to a local SMTP server.
 *
 * No external dependencies — uses Node's built-in `net` module.
 *
 * Usage:
 *   node tools/send-email/send-plain-text-email.mjs
 *   npm run tools:send-plain-text-email   (from repos/ever-admin-services/)
 *
 * Configuration is read from tools/send-email/config.mjs.
 * Edit that file to change host, port, sender, recipient, or subject.
 */

import { createConnection } from "net";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..", "..");

// ---------------------------------------------------------------------------
// SMTP helpers
// ---------------------------------------------------------------------------

function smtpSend(config, text) {
  return new Promise((res, rej) => {
    const socket = createConnection(config.port, config.host);
    const lines = [];
    let step = 0;

    const msgId = `<${Date.now()}.${Math.random().toString(36).slice(2)}@everadmin.local>`;
    const date = new Date().toUTCString();

    // Build a simple plain text message
    const body = [
      `Date: ${date}`,
      `Message-ID: ${msgId}`,
      `From: ${config.from}`,
      `To: ${config.to}`,
      `Subject: ${config.subject}`,
      `Content-Type: text/plain; charset=UTF-8`,
      ``,
      text,
    ].join("\r\n");

    const commands = [
      `EHLO localhost`,
      `MAIL FROM:<${config.from}>`,
      `RCPT TO:<${config.to}>`,
      `DATA`,
      `${body}\r\n.`,
      `QUIT`,
    ];

    socket.setEncoding("utf8");

    socket.on("data", (chunk) => {
      lines.push(chunk.trim());
      const line = chunk.trim();
      const code = parseInt(line, 10);

      // Wait for server greeting (220), then send commands one by one
      if (step === 0 && code === 220) {
        socket.write(commands[0] + "\r\n");
        step++;
        return;
      }

      if (step === 1 && (code === 250 || line.startsWith("250"))) {
        // EHLO may respond with multiple 250 lines — wait until last one
        if (!chunk.includes("\n250 ") && !chunk.endsWith("250 ")) {
          // Still receiving multi-line — just keep going if it ends with a 250
        }
        socket.write(commands[step] + "\r\n");
        step++;
        return;
      }

      if (step >= 2 && step <= 4 && code === 250) {
        socket.write(commands[step] + "\r\n");
        step++;
        return;
      }

      // After DATA we get 354 — send the body
      if (step === 4 && code === 354) {
        socket.write(commands[step] + "\r\n");
        step++;
        return;
      }

      // After body + dot we get 250 — send QUIT
      if (step === 5 && code === 250) {
        socket.write(commands[step] + "\r\n");
        step++;
        return;
      }

      // After QUIT we get 221 — done
      if (code === 221) {
        socket.destroy();
        res(lines.join("\n"));
      }
    });

    socket.on("error", rej);
    socket.on("close", () => {
      if (step < commands.length) rej(new Error("Connection closed prematurely"));
    });
  });
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const { config } = await import("./config.mjs");

  console.log(`SMTP     : ${config.host}:${config.port}`);
  console.log(`From     : ${config.from}`);
  console.log(`To       : ${config.to}`);
  console.log(`Subject  : ${config.subject}`);
  console.log("");

  // Simple plain text message
  const text = `Hello from WhatEver Mail!

This is a plain text email sent to localhost:1025.

Current date: ${new Date().toLocaleDateString()}

Best regards,
The WhatEver Mail Team`;

  await smtpSend(config, text);
  console.log("Plain text email sent successfully.");
}

main().catch((err) => {
  console.error("Failed to send email:", err.message);
  process.exit(1);
});