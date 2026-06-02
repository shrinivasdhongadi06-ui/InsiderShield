import { Employee } from '@/models/Employee';
import { TrustHistory } from '@/models/TrustHistory';
import { parseCommaSeparated } from '@/utils';

// ─── Employee Service ─────────────────────────────────────────────────────────

interface CreateEmployeeInput {
  name: string;
  department: string;
  role: string;
  email?: string;
  trustedDevices?: string;
  usualIPs?: string;
  normalLoginHourRange?: string;
  normalLocation?: string;
  normalDownloads?: string | number;
  normalFilesAccessed?: string | number;
  normalSessionDuration?: string | number;
}

/**
 * Creates a new employee with baseline profile and initial TrustHistory entry.
 */
export async function createEmployee(input: CreateEmployeeInput) {
  const {
    name,
    department,
    role,
    email,
    trustedDevices,
    usualIPs,
    normalLoginHourRange,
    normalLocation,
    normalDownloads,
    normalFilesAccessed,
    normalSessionDuration,
  } = input;

  const resolvedEmail =
    email?.trim() ||
    `${name.toLowerCase().replace(/\s+/g, '.')}@insidershield.local`;

  const newEmployee = await Employee.create({
    name: name.trim(),
    department: department.trim(),
    role: role.trim(),
    email: resolvedEmail,
    currentTrustScore: 100,
    status: 'Active',
    baseline: {
      normalLoginHourRange: normalLoginHourRange?.trim() || '09:00-17:00',
      trustedDevices: parseCommaSeparated(trustedDevices, ['Corporate Laptop']),
      normalLocation: normalLocation?.trim() || 'Office',
      normalDownloads: Number(normalDownloads) || 5,
      normalFilesAccessed: Number(normalFilesAccessed) || 20,
      normalSessionDuration: Number(normalSessionDuration) || 480,
      usualIPs: parseCommaSeparated(usualIPs, ['192.168.1.100']),
    },
  });

  await TrustHistory.create({
    employeeId: newEmployee._id,
    score: 100,
    changeReason: 'Employee profile initialized',
  });

  return newEmployee;
}
