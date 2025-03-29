import { NextRequest, NextResponse } from 'next/server';

declare module 'next/server' {
  // Define the route handler parameter types
  export type RouteHandlerContext<T = Record<string, string>> = {
    params: T;
  };
}
