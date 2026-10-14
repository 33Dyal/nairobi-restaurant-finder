import { z } from "zod";
import { ok, handleError, parseBody } from "@/lib/utils/api";
import { assertSameOrigin } from "@/lib/auth/csrf";
import { enforceRateLimit, getClientIp } from "@/lib/auth/rate-limit";
import { recommend } from "@/lib/ai/recommend";

const schema = z.object({
  query: z.string().trim().min(3, "Tell me what you're looking for.").max(300, "Please keep it under 300 characters."),
});

export async function POST(request) {
  try {
    assertSameOrigin(request);
    enforceRateLimit(`ai:${getClientIp(request)}`, 12, 10 * 60 * 1000);
    const { query } = await parseBody(request, schema);
    return ok(await recommend(query));
  } catch (error) {
    return handleError(error);
  }
}