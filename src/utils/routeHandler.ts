import { NextResponse } from 'next/server';

// Type for route handler context with dynamic params
export type RouteContext<T = Record<string, string>> = {
  params: T;
};

// Helper function to create a route handler with proper typing
export function createRouteHandler<T = Record<string, string>>(
  handler: (request: Request, context: RouteContext<T>) => Promise<Response>
) {
  return async (request: Request, context: RouteContext<T>) => {
    try {
      return await handler(request, context);
    } catch (error) {
      console.error('Route handler error:', error);
      return NextResponse.json(
        { error: 'An unexpected error occurred' },
        { status: 500 }
      );
    }
  };
}
