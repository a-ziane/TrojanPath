import { authenticated, headers, json, limitedBody } from "../_shared/http.ts";
import { skillQuestion } from "../_shared/skill-question.ts";
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS")
    return new Response("ok", { headers: headers(req) });
  if (req.method !== "POST") return json(req, { error: "POST required" }, 405);
  try {
    const { client } = await authenticated(req);
    const body = JSON.parse(
      new TextDecoder().decode(await limitedBody(req, 1024)),
    );
    if (
      typeof body.skill !== "string" ||
      !body.skill.trim() ||
      body.skill.length > 80
    )
      return json(req, { error: "Invalid skill" }, 400);
    const { data: allowed, error } = await client.rpc(
      "reserve_planning_request",
    );
    if (error || !allowed)
      return json(
        req,
        {
          error:
            "AI limit reached. You can still describe how you use this skill.",
        },
        429,
      );
    return json(req, {
      question: await skillQuestion(body.skill),
      source: "gemini",
    });
  } catch (err) {
    const auth =
      err instanceof Error && err.message === "Authentication required";
    return json(
      req,
      {
        error: auth
          ? "Authentication required"
          : "Question unavailable. You can still describe how you use this skill.",
      },
      auth ? 401 : 503,
    );
  }
});
