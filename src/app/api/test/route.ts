import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/mongodb";

export async function GET() {
  await connectDB();

  return NextResponse.json({
    success: true,
    message: "MongoDB Connected Successfully",
  });
}