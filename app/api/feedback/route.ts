import { Humanloop, ChatMessage } from "humanloop";

if (!process.env.HUMANLOOP_API_KEY) {
  throw new Error(
    "no Humanloop API key provided; add one to your .env.local file with: `HUMANLOOP_API_KEY=..."
  );
}

const humanloop = new Humanloop({
  apiKey: process.env.HUMANLOOP_API_KEY,
});

interface FeedbackRequest {
  id: string;
  value: string;
}

export async function POST(req: Request): Promise<Response> {
  const feedbackRequest: FeedbackRequest = await req.json();

  await humanloop.feedback({
    type: "rating",
    data_id: feedbackRequest.id,
    value: feedbackRequest.value,
  });

  return new Response();
}
