import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/mongodb";
import { ActivityLog } from "@/models/ActivityLog";
import { Alert } from "@/models/Alert";
import { TrustHistory } from "@/models/TrustHistory";

export async function GET() {
  try {
    await connectDB();

    // OPTIONAL:
    // Clear only monitoring-related collections
    // DO NOT delete employees anymore

    await ActivityLog.deleteMany({});
    await Alert.deleteMany({});
    await TrustHistory.deleteMany({});

    return NextResponse.json({
      success: true,
      message: "Monitoring data reset successfully",
    });

  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}