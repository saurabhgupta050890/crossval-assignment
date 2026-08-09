/**
 * Field-level validation errors keyed by field name.
 * Matches the shape returned by Zod's `error.flatten().fieldErrors`.
 */
export type ApiFieldErrors = Record<string, string[] | undefined>;

/**
 * A simple error response (400 | 401 | 404 | 409 | 500).
 *   { error: "Some message" }
 */
export interface ApiErrorResponse {
  error: string;
}

/**
 * A validation-failure response (422).
 *   { error: "Validation failed", issues: { fieldName: ["msg", …] } }
 */
export interface ApiValidationErrorResponse extends ApiErrorResponse {
  issues: ApiFieldErrors;
}

/** Union of every possible API error body. */
export type AnyApiError = ApiErrorResponse | ApiValidationErrorResponse;

/** Narrows to the validation-error variant. */
export function isValidationError(
  err: AnyApiError,
): err is ApiValidationErrorResponse {
  return "issues" in err;
}

/**
 * Safely parse an error message from a failed fetch Response.
 * Falls back to `fallback` if the body isn't valid JSON or has no `error` field.
 */
export async function parseApiError(
  res: Response,
  fallback = "An unexpected error occurred",
): Promise<{ message: string; issues?: ApiFieldErrors }> {
  let body: Partial<ApiValidationErrorResponse> = {};
  try {
    body = await res.json();
  } catch {
    // body is not JSON – use fallback
  }
  return {
    message: body.error ?? fallback,
    issues: body.issues,
  };
}
