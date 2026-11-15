/** Preserve actionable server errors instead of hiding every failure behind retry. */
export async function planningError(
  error: { context?: unknown },
  origin: string,
) {
  const response = error.context;
  if (response instanceof Response) {
    if (response.status === 401)
      return "Your sign-in expired. Sign out and sign in again, then generate your plan.";
    try {
      const body = await response.clone().json();
      if (typeof body.error === "string" && body.error.trim())
        return body.error;
    } catch {
      /* A gateway error may not contain JSON. */
    }
    return `The planning service returned an error (${response.status}). Your saved work is safe. Please retry.`;
  }
  return `The browser could not connect to AI planning from ${origin}. Reload this page and retry. Your saved work is safe.`;
}
