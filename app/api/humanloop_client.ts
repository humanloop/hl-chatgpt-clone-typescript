import { HumanloopClient } from "humanloop";

export const PROMPT_HUMANLOOP_PATH =
  "chatgpt-clone-tutorial/customer-support-agent";

if (!process.env.HUMANLOOP_API_KEY) {
  throw Error(
    "no Humanloop API key provided; add one to your .env.local file with: `HUMANLOOP_API_KEY=...",
  );
}

export const humanloop = new HumanloopClient({
  environment: "https://api.humanloop.ml/v5",
  apiKey: process.env.HUMANLOOP_API_KEY,
});
