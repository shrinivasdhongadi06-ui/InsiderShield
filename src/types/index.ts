// ─── Core Entity Types ────────────────────────────────────────────────────────

export interface IEmployeeBaseline {
  normalLoginHourRange: string;
  trustedDevices: string[];
  usualIPs: string[];
  normalLocation: string;
  normalDownloads: number;
  normalFilesAccessed: number;
  normalSessionDuration: number;
}

export interface IEmployee {
  _id: string;
  name: string;
  department: string;
  role: string;
  email: string;
  currentTrustScore: number;
  status: EmployeeStatus;
  baseline: IEmployeeBaseline;
  createdAt?: string;
  updatedAt?: string;
}

export interface IActivityLog {
  _id: string;
  employeeId: string | IEmployee;
  action: string;
  timestamp: string;
  details: string;
  device: string;
  ipAddress: string;
  riskScore: number;
  loginHour: number;
  downloads: number;
  filesAccessed: number;
  location: string;
  sessionDuration: number;
  anomalyScore: number;
  trustImpact: number;
  sessionId?: string;  // Task 8: session correlation
}

export interface IAlert {
  _id: string;
  employeeId: string | IEmployee;
  severity: AlertSeverity;
  title: string;
  description: string;
  reasoning: string[];
  status: AlertStatus;
  timestamp: string;
  resolvedAt?: string;
  resolvedNote?: string;
}

export interface ITrustHistory {
  _id: string;
  employeeId: string;
  score: number;
  timestamp: string;
  changeReason: string;
  // Trust Intelligence Engine additions
  anomalyScore?: number;
  riskFactors?: string[];
  sensitivity?: string;
}

// ─── Enum Types ───────────────────────────────────────────────────────────────

export type EmployeeStatus = 'Active' | 'Isolated' | 'Suspended';
export type AlertSeverity = 'Low' | 'Medium' | 'High' | 'Critical';
export type AlertStatus =
  | 'Open'
  | 'Investigating'
  | 'Resolved'
  | 'Isolated'
  | 'Escalated'
  | 'FalsePositive';
export type RiskLevel = 'normal' | 'suspicious' | 'critical';
export type ActivityFilter = 'All' | 'Normal' | 'Suspicious' | 'Critical';
export type SortOrder = 'asc' | 'desc';

// ─── Dashboard/Analytics Types ────────────────────────────────────────────────

export interface IDashboardStats {
  totalEmployees: number;
  activeEmployees: number;
  isolatedSessions: number;
  threatsDetected: number;
  avgTrustScore: number;
}

export interface IThreatStats {
  activeThreats: number;
  criticalIncidents: number;
  isolatedSessions: number;
  avgRiskScore: number;
}

export interface IActivityAnalytics {
  downloadsByDay: { date: string; downloads: number }[];
  anomalyByDay: { date: string; anomaly: number }[];
  loginHours: { hour: number; count: number }[];
  trustHistory: { date: string; avgTrust: number }[];
}

export interface ISearchResults {
  employees: Array<{
    _id: string;
    name: string;
    email: string;
    department: string;
    role: string;
    currentTrustScore: number;
    status: string;
  }>;
  alerts: Array<{
    _id: string;
    title: string;
    severity: string;
    status: string;
    timestamp?: string;
    employeeId?: { name?: string } | null;
  }>;
}

// ─── API Response Types ───────────────────────────────────────────────────────

export interface APISuccessResponse<T = unknown> {
  success: true;
  data: T;
}

export interface APIErrorResponse {
  success: false;
  error: string;
}

export type APIResponse<T = unknown> = APISuccessResponse<T> | APIErrorResponse;

// ─── Employee Detail Page Type ────────────────────────────────────────────────

export interface IEmployeeDetail {
  employee: IEmployee;
  logs: IActivityLog[];
  alerts: IAlert[];
  trustHistory: ITrustHistory[];
}

// ─── Pagination Types ─────────────────────────────────────────────────────────

export interface IPaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface IPaginatedResponse<T> {
  items: T[];
  pagination: IPaginationMeta;
}

// ─── Filter / Query Param Types ───────────────────────────────────────────────

export interface IActivityFilterParams {
  search?: string;
  filter?: string;        // normal | suspicious | critical
  employeeId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: SortOrder;
}

export interface IAlertFilterParams {
  severity?: AlertSeverity;
  status?: AlertStatus;
  employeeId?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: SortOrder;
}

export interface IEmployeeFilterParams {
  search?: string;
  department?: string;
  status?: EmployeeStatus;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: SortOrder;
}

// ─── Alert Lifecycle Action Types ─────────────────────────────────────────────

export interface IAlertLifecyclePayload {
  status: AlertStatus;
  note?: string;
}
