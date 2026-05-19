import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/mongodb";
import { Employee } from "@/models/Employee";
import { ActivityLog } from "@/models/ActivityLog";
import { Alert } from "@/models/Alert";
import { TrustHistory } from "@/models/TrustHistory";

const NORMAL_ACTIONS = [
"Login",
"Read Document",
"Email Sent",
"Meeting Joined",
];

const SUSPICIOUS_ACTIONS = [
"Bulk Download",
"Unauthorized File Access",
"Login Outside Working Hours",
"Unknown Device Access",
];

function randomBetween(min: number, max: number) {
return Math.floor(Math.random() * (max - min + 1)) + min;
}

export async function POST() {
try {
await connectDB();

// Fetch active employees only
const activeEmployees = await Employee.find({
  status: "Active",
});

if (activeEmployees.length === 0) {
  return NextResponse.json({
    success: false,
    message: "No active employees found.",
  });
}

// Pick random employee
const employee =
  activeEmployees[
    Math.floor(Math.random() * activeEmployees.length)
  ];

const isSuspicious = Math.random() < 0.25;

let action = "";
let trustImpact = 0;
let anomalyScore = 0;

// Baseline values
const baseline = employee.baseline;

// Simulated behavior fields
let loginHour = randomBetween(9, 17);
let device =
  baseline.trustedDevices?.[0] || "Corporate Laptop";

let downloads = randomBetween(
  1,
  baseline.normalDownloads || 5
);

let filesAccessed = randomBetween(
  5,
  baseline.normalFilesAccessed || 20
);

let location =
  baseline.normalLocation || "Office";

let sessionDuration = randomBetween(
  30,
  baseline.normalSessionDuration || 480
);

// Suspicious behavior generation
if (isSuspicious) {
  action =
    SUSPICIOUS_ACTIONS[
      Math.floor(
        Math.random() * SUSPICIOUS_ACTIONS.length
      )
    ];

  anomalyScore = randomBetween(20, 50);
  trustImpact = -randomBetween(10, 25);

  // Generate suspicious deviations
  loginHour = randomBetween(1, 5);

  device = "Unknown Device";

  downloads =
    (baseline.normalDownloads || 5) +
    randomBetween(50, 300);

  filesAccessed =
    (baseline.normalFilesAccessed || 20) +
    randomBetween(50, 200);

  location = "Foreign Location";

  sessionDuration =
    (baseline.normalSessionDuration || 480) +
    randomBetween(200, 500);

} else {
  action =
    NORMAL_ACTIONS[
      Math.floor(
        Math.random() * NORMAL_ACTIONS.length
      )
    ];

  anomalyScore = 0;
  trustImpact = randomBetween(1, 3);
}

// Create activity log
await ActivityLog.create({
  employeeId: employee._id,

  action,

  details: isSuspicious
    ? `Suspicious behavior detected: ${action}`
    : `Normal activity detected: ${action}`,

  loginHour,
  device,
  downloads,
  filesAccessed,
  location,
  sessionDuration,

  ipAddress:
    baseline.usualIPs?.[0] || "192.168.1.1",

  anomalyScore,
  trustImpact,

  timestamp: new Date(),
});

// Update trust score
let newScore =
  employee.currentTrustScore + trustImpact;

if (newScore > 100) newScore = 100;
if (newScore < 0) newScore = 0;

let newStatus = employee.status;
let alertCreated = false;

// Generate alerts for suspicious behavior

if (anomalyScore > 25) {
  alertCreated = true;

  if (newScore < 50) {
    newStatus = "Isolated";
  }

  await Alert.create({
    employeeId: employee._id,

    severity:
      anomalyScore > 40
        ? "Critical"
        : anomalyScore > 30
        ? "High"
        : "Medium",

    title: `Behavioral Anomaly Detected`,

    description:
      `${employee.name} displayed suspicious activity patterns.`,

    reasoning: [
      `Login detected at ${loginHour}:00 hours`,
      `Device used: ${device}`,
      `Downloads exceeded baseline`,
      `Files accessed unusually high`,
      `Location anomaly detected`,
      `Abnormal session duration observed`,
    ],

    status: newStatus === "Isolated" ? "Isolated" : "Open",
  });
}

// Save employee updates
employee.currentTrustScore = newScore;
employee.status = newStatus;

await employee.save();

// Save trust history
await TrustHistory.create({
  employeeId: employee._id,
  score: newScore,
  changeReason: action,
});

return NextResponse.json({
  success: true,

  employee: employee.name,

  action,

  anomalyScore,

  trustImpact,

  newScore,

  status: newStatus,

  alertCreated,
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
