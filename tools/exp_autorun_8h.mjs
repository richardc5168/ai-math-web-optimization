#!/usr/bin/env node
if (!process.env.MAX_RUNTIME_MIN) {
  process.env.MAX_RUNTIME_MIN = "480";
}
await import("./exp_autorun.mjs");
