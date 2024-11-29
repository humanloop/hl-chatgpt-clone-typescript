import { HumanloopClient } from "humanloop";
import { humanloop } from "../humanloop_client";

const PATH_TO_EVALUATOR = "Example Evaluators/Human/rating";
export async function POST(req: Request): Promise<Response> {
  const body = await req.json();
  const response = await humanloop.evaluators.log({
    parentId: body.logId,
    path: PATH_TO_EVALUATOR,
    judgment: body.judgment,
    spec : {
      argumentsType: "target_free",
      returnType: "select",
      evaluatorType: "human",
      options: [{"name": "bad", "valence": "negative"}, {"name": "good", "valence": "positive"}]

    }

  });
  return new Response();
}
