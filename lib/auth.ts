import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { getSession, SessionPayload } from "@/lib/session";

type AuthenticatedHandler<TParams = any> = (
  req: NextRequest,
  session: SessionPayload,
  context: any
) => Promise<NextResponse> | NextResponse;

/**
 * Wraps a route handler and ensures the caller is authenticated.
 * Injects the verified session payload as the second argument so handlers
 * never have to call getSession() themselves.
 *
 * Usage (no route params):
 *   export const GET = withAuth(async (req, session) => { … });
 *
 * Usage (with route params):
 *   export const GET = withAuth<{ id: string }>(async (req, session, { params }) => { … });
 */
export function withAuth<TParams = any>(
  handler: AuthenticatedHandler<TParams>
) {
  return async (
    req: NextRequest,
    context: any
  ): Promise<NextResponse> => {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return handler(req, session, context as any);
  };
}
