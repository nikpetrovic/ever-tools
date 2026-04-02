/**
 * Default configuration for the send-email tool.
 * Copy and edit values here to target different templates or environments.
 */
export const config = {
  // SMTP server
  host: "localhost",
  port: 1025,

  // Sender / recipient
  from: "office@whatevermail.io",
  to: "test@whatevermail.io",
  subject: "WhatEver Mail Welcome",

  // Path to the HTML template file, relative to the repo root (ever-admin-services/)
  templatePath: "examples/email-templates/milan/hvala-milan.html",
};
