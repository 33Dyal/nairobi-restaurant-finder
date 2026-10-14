import { NextResponse } from "next/server";
import { ZodError, z } from "zod";

export class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export function ok(data, init = {}) {
  return NextResponse.json({ success: true, data }, init);
}

export function fail(message, status = 400, details) {
  return NextResponse.json(
    { success: false, error: { message, ...(details ? { details } : {}) } },
    { status }
  );
}

export function handleError(error) {
  if (error instanceof ApiError) return fail(error.message, error.status, error.details);
  if (error instanceof ZodError) {
    return fail("Please check the highlighted fields.", 422, z.flattenError(error).fieldErrors);
  }
  console.error("[API ERROR]", error);
  return fail("Something went wrong. Please try again.", 500);
}

// Parses a JSON body and validates it with a Zod schema.
export async function parseBody(request, schema) {
  let json;
  try {
    json = await request.json();
  } catch {
    throw new ApiError(400, "Request body must be valid JSON.");
  }
  return schema.parse(json);
}
