#!/usr/bin/env node
if (!process.env.LOCAL_EVENTS_JSONL) {
  process.env.LOCAL_EVENTS_JSONL = "fixtures/exp_autorun_sample_events.jsonl";
}
if (!process.env.MAX_RUNTIME_MIN) {
  process.env.MAX_RUNTIME_MIN = "1";
}
await import("./exp_autorun.mjs");
