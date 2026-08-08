import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const res = NextResponse.redirect(new URL("/tax/login", request.url));
  res.cookies.delete("tax-token");
  res.cookies.delete("tax-refresh");
  return res;
}
