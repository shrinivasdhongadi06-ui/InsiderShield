"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Shield, LayoutDashboard, FolderClosed, Mail, Video, Activity,
  Bell, User, LogOut, Clock, Monitor, MapPin, Plus, Send,
  Inbox, SendIcon, AlertCircle, FileText, Download, CheckCircle,
  HelpCircle, ChevronRight, Laptop, Calendar, MessageSquare, Info,
  Loader2, Globe
} from 'lucide-react';

export default function EmployeeWorkspacePortal() {
  const router = useRouter();
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const [employee, setEmployee] = useState<any>(null);
  const [employeesList, setEmployeesList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Portal tabs
  const [activeTab, setActiveTab] = useState<'dashboard' | 'files' | 'emails' | 'meetings' | 'activity' | 'notifications' | 'profile'>('dashboard');

  // Session state
  const [sessionStart, setSessionStart] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState('00:00:00');
  const [isOnline, setIsOnline] = useState(false);
  const [simulatedLocation, setSimulatedLocation] = useState('Office');
  const [browserName, setBrowserName] = useState('Chrome');
  const [osName, setOsName] = useState('Windows');

  // Content states
  const [files, setFiles] = useState<any[]>([]);
  const [inbox, setInbox] = useState<any[]>([]);
  const [sentEmails, setSentEmails] = useState<any[]>([]);
  const [meetings, setMeetings] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [stats, setStats] = useState({
    filesUploaded: 0,
    filesDownloaded: 0,
    emailsSent: 0,
    meetingsJoined: 0
  });

  // Recent activity logs
  const [logs, setLogs] = useState<any[]>([]);

  // Form states
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [dummyFileName, setDummyFileName] = useState('');
  const [dummyFileContent, setDummyFileContent] = useState('');
  const [emailTo, setEmailTo] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailMessage, setEmailMessage] = useState('');
  const [selectedMeeting, setSelectedMeeting] = useState<any>(null);
  const [selectedFileMeta, setSelectedFileMeta] = useState<any>(null);
  const [activeMail, setActiveMail] = useState<any>(null);

  // 1. Initial state restoration
  useEffect(() => {
    const id = localStorage.getItem('insidershield_employee_id');
    if (!id) {
      router.push('/employee/login');
      return;
    }
    setEmployeeId(id);

    // Detect browser and OS
    if (typeof window !== 'undefined') {
      const ua = navigator.userAgent;
      let browser = 'Chrome';
      let os = 'Windows';
      if (ua.includes('Firefox')) browser = 'Firefox';
      else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
      else if (ua.includes('Edge')) browser = 'Edge';
      if (ua.includes('Macintosh')) os = 'macOS';
      else if (ua.includes('Linux')) os = 'Linux';
      else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
      setBrowserName(browser);
      setOsName(os);
    }

    // Retrieve active session state
    const savedStart = localStorage.getItem(`session_start_${id}`);
    const savedLoc = localStorage.getItem(`session_loc_${id}`);
    if (savedStart) {
      setSessionStart(Number(savedStart));
      setIsOnline(true);
    }
    if (savedLoc) {
      setSimulatedLocation(savedLoc);
    }

    loadInitialData(id);
  }, [router]);

  // 2. Active Session Timer
  useEffect(() => {
    if (!isOnline || !sessionStart) {
      setElapsedTime('00:00:00');
      return;
    }

    const interval = setInterval(() => {
      const diffMs = Date.now() - sessionStart;
      const hours = Math.floor(diffMs / 3600000);
      const minutes = Math.floor((diffMs % 3600000) / 60000);
      const seconds = Math.floor((diffMs % 60000) / 1000);

      const pad = (num: number) => String(num).padStart(2, '0');
      setElapsedTime(`${pad(hours)}:${pad(minutes)}:${pad(seconds)}`);
    }, 1000);

    return () => clearInterval(interval);
  }, [isOnline, sessionStart]);

  // 3. Load all workstation telemetry
  const loadInitialData = async (id: string) => {
    try {
      const [empRes, employeesRes, meetingsRes, notificationsRes, statsRes] = await Promise.all([
        fetch(`/api/employees/${id}`),
        fetch('/api/employees?pageSize=100'),
        fetch('/api/employee/meetings'),
        fetch(`/api/employee/notifications?employeeId=${id}`),
        fetch(`/api/employee/stats?employeeId=${id}`)
      ]);

      if (empRes.ok) {
        const empData = await empRes.json();
        setEmployee(empData.data?.employee);
        setLogs(empData.data?.logs || []);
        if (empData.data?.employee?.baseline?.normalLocation && !localStorage.getItem(`session_loc_${id}`)) {
          setSimulatedLocation(empData.data.employee.baseline.normalLocation);
        }
      }

      if (employeesRes.ok) {
        const employeesData = await employeesRes.json();
        setEmployeesList(employeesData.data?.items || []);
        // Pick first email as default recipient
        const filtered = (employeesData.data?.items || []).filter((e: any) => e._id !== id);
        if (filtered.length > 0) {
          setEmailTo(filtered[0].email);
        }
      }

      if (meetingsRes.ok) {
        const meetingsData = await meetingsRes.json();
        setMeetings(meetingsData.data || []);
      }

      if (notificationsRes.ok) {
        const notificationsData = await notificationsRes.json();
        setNotifications(notificationsData.data || []);
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.data);
      }

      // Fetch emails
      fetchEmails(id);
      // Fetch files
      fetchFiles(id);

    } catch (err) {
      console.error('Error loading employee portal data:', err);
      setError('System synchronization error. Please check database connectivity.');
    } finally {
      setLoading(false);
    }
  };

  const fetchEmails = async (id: string) => {
    try {
      const res = await fetch(`/api/employee/emails?employeeId=${id}`);
      if (res.ok) {
        const data = await res.json();
        setInbox(data.data?.inbox || []);
        setSentEmails(data.data?.sent || []);
      }
    } catch (err) {
      console.error('Failed to load email inbox:', err);
    }
  };

  const fetchFiles = async (id: string) => {
    try {
      const res = await fetch(`/api/employee/files?employeeId=${id}`);
      if (res.ok) {
        const data = await res.json();
        setFiles(data.data || []);
      }
    } catch (err) {
      console.error('Failed to load user files:', err);
    }
  };

  const refreshStatsAndActivity = async () => {
    if (!employeeId) return;
    try {
      const [statsRes, empRes] = await Promise.all([
        fetch(`/api/employee/stats?employeeId=${employeeId}`),
        fetch(`/api/employees/${employeeId}`)
      ]);
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.data);
      }
      if (empRes.ok) {
        const empData = await empRes.json();
        setLogs(empData.data?.logs || []);
      }
    } catch (err) {
      console.error('Failed to refresh stats:', err);
    }
  };

  // 4. WORKSPACE LOGIN ACTIONS
  const handlePortalLogin = async () => {
    if (!employeeId) return;
    setSubmitting(true);
    setError('');
    
    const deviceString = `${browserName} on ${osName}`;
    const payload = {
      employeeId,
      action: 'Login',
      device: deviceString,
      location: simulatedLocation,
      loginHour: new Date().getHours()
    };

    try {
      const res = await fetch('/api/activity/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || 'Failed to authenticate workstation session.');
      }

      const start = Date.now();
      setSessionStart(start);
      localStorage.setItem(`session_start_${employeeId}`, String(start));
      localStorage.setItem(`session_loc_${employeeId}`, simulatedLocation);
      setIsOnline(true);
      setSuccessMsg('Workstation authenticated. Safe environment established.');
      setTimeout(() => setSuccessMsg(''), 4000);

      await refreshStatsAndActivity();
    } catch (err: any) {
      setError(err.message || 'Connection timeout. Workstation login failed.');
    } finally {
      setSubmitting(false);
    }
  };

  // 5. WORKSPACE LOGOUT ACTIONS
  const handlePortalLogout = async () => {
    if (!employeeId) return;
    setSubmitting(true);
    setError('');

    let sessionDuration = 0;
    if (sessionStart) {
      sessionDuration = Math.max(1, Math.round((Date.now() - sessionStart) / 60000));
    }

    const deviceString = `${browserName} on ${osName}`;
    const payload = {
      employeeId,
      action: 'Logout',
      device: deviceString,
      location: simulatedLocation,
      loginHour: new Date().getHours(),
      sessionDuration
    };

    try {
      const res = await fetch('/api/activity/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || 'Failed to gracefully close workstation session.');
      }

      setSessionStart(null);
      localStorage.removeItem(`session_start_${employeeId}`);
      localStorage.removeItem(`session_loc_${employeeId}`);
      setIsOnline(false);
      setActiveTab('dashboard');
      setSuccessMsg('Session terminated. Workstation locked.');
      setTimeout(() => setSuccessMsg(''), 4000);

      await refreshStatsAndActivity();
    } catch (err: any) {
      setError(err.message || 'Connection error. Logout could not be registered.');
    } finally {
      setSubmitting(false);
    }
  };

  // 6. COMPOSING EMAIL
  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId || !emailTo || !emailSubject || !emailMessage) return;
    setSubmitting(true);
    setError('');

    const deviceString = `${browserName} on ${osName}`;
    const payload = {
      employeeId,
      recipientEmail: emailTo,
      subject: emailSubject,
      message: emailMessage,
      device: deviceString,
      location: simulatedLocation,
      loginHour: new Date().getHours()
    };

    try {
      const res = await fetch('/api/employee/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || 'SMTP delivery failure.');
      }

      setEmailSubject('');
      setEmailMessage('');
      setSuccessMsg(`Email dispatched successfully to ${emailTo}.`);
      setTimeout(() => setSuccessMsg(''), 4500);

      // Refresh email archives and statistics
      await fetchEmails(employeeId);
      await refreshStatsAndActivity();
    } catch (err: any) {
      setError(err.message || 'Failed to submit mail activity.');
    } finally {
      setSubmitting(false);
    }
  };

  // 7. FILE MANAGEMENT (UPLOAD & DOWNLOAD)
  const handleUploadFileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId) return;

    setError('');
    let name = '';
    let size = 0;
    let mimeType = '';
    let content = '';

    if (uploadFile) {
      name = uploadFile.name;
      size = uploadFile.size;
      mimeType = uploadFile.type || 'application/octet-stream';
      
      // Read file content
      const reader = new FileReader();
      reader.onload = async () => {
        const fileContent = reader.result as string;
        await sendFileUploadPayload(name, size, mimeType, fileContent);
      };
      reader.readAsText(uploadFile);
    } else {
      if (!dummyFileName) {
        setError('Please choose a file or write a dummy filename.');
        return;
      }
      name = dummyFileName.endsWith('.txt') || dummyFileName.endsWith('.docx') || dummyFileName.endsWith('.pdf')
        ? dummyFileName
        : `${dummyFileName}.txt`;
      size = Math.round(dummyFileContent.length * 1.2) || 450;
      mimeType = name.endsWith('.pdf') ? 'application/pdf' : name.endsWith('.docx') ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' : 'text/plain';
      content = dummyFileContent || 'Sandbox simulated file metadata contents.';
      await sendFileUploadPayload(name, size, mimeType, content);
    }
  };

  const sendFileUploadPayload = async (name: string, size: number, mimeType: string, content: string) => {
    setSubmitting(true);
    const deviceString = `${browserName} on ${osName}`;
    const payload = {
      employeeId,
      name,
      size,
      mimeType,
      content,
      device: deviceString,
      location: simulatedLocation,
      loginHour: new Date().getHours()
    };

    try {
      const res = await fetch('/api/employee/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || 'Secure upload vault rejected file.');
      }

      setDummyFileName('');
      setDummyFileContent('');
      setUploadFile(null);
      setSuccessMsg(`Document ${name} uploaded safely.`);
      setTimeout(() => setSuccessMsg(''), 4000);

      // Refresh files list
      await fetchFiles(employeeId!);
      await refreshStatsAndActivity();
    } catch (err: any) {
      setError(err.message || 'File upload failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadFile = async (fileId: string, fileName: string) => {
    if (!employeeId) return;
    try {
      const res = await fetch(`/api/employee/files/${fileId}/download?employeeId=${employeeId}&location=${simulatedLocation}`);
      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || 'Secure storage cluster rejected download Request.');
      }
      const data = await res.json();
      const fileData = data.data?.file;

      if (fileData) {
        // Trigger browser native file download download
        const blob = new Blob([fileData.content || 'Dummy secure file download content.'], { type: fileData.mimeType });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }

      setSuccessMsg(`Initiated secure download of ${fileName}.`);
      setTimeout(() => setSuccessMsg(''), 4000);

      await refreshStatsAndActivity();
    } catch (err: any) {
      setError(err.message || 'Secure download failed.');
    }
  };

  // 8. MEETINGS
  const handleJoinMeeting = async (meetingId: string, meetingName: string) => {
    if (!employeeId) return;
    setSubmitting(true);
    setError('');

    const deviceString = `${browserName} on ${osName}`;
    const payload = {
      employeeId,
      meetingId,
      device: deviceString,
      location: simulatedLocation,
      loginHour: new Date().getHours()
    };

    try {
      const res = await fetch('/api/employee/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || 'Video conference session initialization rejected.');
      }

      const data = await res.json();
      setSelectedMeeting(data.data?.meeting);
      
      setSuccessMsg(`Joined video session: ${meetingName}`);
      setTimeout(() => setSuccessMsg(''), 4000);

      await refreshStatsAndActivity();
    } catch (err: any) {
      setError(err.message || 'Conference session failed.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
          <p className="text-slate-400 text-sm">Loading Employee Workstation Workspace...</p>
        </div>
      </div>
    );
  }

  // Workstation Lock Screen / Offline screen
  if (!isOnline) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center relative overflow-hidden">
        {/* Background radial and linear glow gradients */}
        <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-blue-600/10 rounded-full blur-[150px]"></div>
        <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] bg-indigo-600/10 rounded-full blur-[150px]"></div>
        
        <div className="z-10 w-full max-w-md p-1 bg-gradient-to-tr from-slate-800 to-slate-900 rounded-2xl border border-slate-800 shadow-2xl">
          <div className="bg-slate-950 p-8 rounded-2xl space-y-6">
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 relative shadow-inner">
                <Laptop className="w-7 h-7 text-blue-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">Workstation Lock</h1>
                <p className="text-slate-400 text-xs mt-1">Enterprise Desktop Environment</p>
              </div>
            </div>

            {error && (
              <div className="p-3.5 bg-red-950/40 border border-red-900/30 text-red-400 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3.5 bg-emerald-950/40 border border-emerald-900/30 text-emerald-400 text-xs rounded-xl flex items-center gap-2">
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Profile Detail */}
            <div className="p-4 bg-slate-900/60 border border-slate-850 rounded-xl space-y-2 text-xs">
              <div className="flex justify-between border-b border-slate-850/50 pb-2">
                <span className="text-slate-500">Employee</span>
                <span className="text-slate-200 font-semibold">{employee?.name}</span>
              </div>
              <div className="flex justify-between border-b border-slate-850/50 pb-2">
                <span className="text-slate-500">Department</span>
                <span className="text-slate-200">{employee?.department}</span>
              </div>
              <div className="flex justify-between border-b border-slate-850/50 pb-2">
                <span className="text-slate-500">Role</span>
                <span className="text-slate-200">{employee?.role}</span>
              </div>
              <div className="flex justify-between pt-1">
                <span className="text-slate-500">System Device</span>
                <span className="text-slate-300 font-mono text-[10px]">{browserName} on {osName}</span>
              </div>
            </div>

            {/* Location Selection & Authentication */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="location-select" className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-blue-400" /> Simulated Location
                </label>
                <div className="relative">
                  <select
                    id="location-select"
                    data-testid="location-select"
                    value={simulatedLocation}
                    onChange={(e) => setSimulatedLocation(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 appearance-none cursor-pointer"
                  >
                    <option value="Office">Office (Corporate Network)</option>
                    <option value="Home">Home (San Francisco)</option>
                    <option value="Chicago">Chicago Branch</option>
                    <option value="London">London Office (Remote VPN)</option>
                    <option value="Tokyo">Tokyo HQ (Remote VPN)</option>
                    <option value="Unknown">Unknown Location (Public IP)</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                    <svg className="fill-current h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                      <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                    </svg>
                  </div>
                </div>
              </div>

              <button
                onClick={handlePortalLogin}
                disabled={submitting}
                data-testid="unlock-workstation-button"
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-blue-600/10 hover:shadow-blue-500/20 flex items-center justify-center gap-2 text-xs"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Authenticating...
                  </>
                ) : (
                  'Login & Unlock Workstation'
                )}
              </button>
              
              <Link href="/employee/login" className="block text-center text-[10px] text-slate-500 hover:text-slate-350 transition-colors">
                Change Selected Identity
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Workstation Active Desktop Portal
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans relative overflow-hidden">
      {/* Glow Backdrops */}
      <div className="absolute top-0 right-0 w-[40%] h-[40%] bg-blue-500/5 rounded-full blur-[130px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[45%] h-[45%] bg-indigo-500/5 rounded-full blur-[140px] pointer-events-none"></div>

      {/* Top Header */}
      <header className="border-b border-slate-900 bg-slate-950/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600/10 flex items-center justify-center border border-blue-500/20">
              <Laptop className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white tracking-tight leading-tight">Workstation Portal</h1>
              <p className="text-[10px] text-slate-500">Secure Sandboxed Enterprise Workspace</p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            {/* Session Timer Widget */}
            <div className="hidden sm:flex items-center gap-4 bg-slate-900 border border-slate-850 px-3 py-1.5 rounded-xl">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Active Session</span>
              </div>
              <span className="text-xs font-mono font-bold text-slate-100">{elapsedTime}</span>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-600/15 border border-blue-500/20 flex items-center justify-center font-bold text-sm text-blue-400">
                {employee?.name?.charAt(0)}
              </div>
              <div className="hidden md:block text-left">
                <div className="text-xs font-bold text-slate-200">{employee?.name}</div>
                <div className="text-[9px] text-slate-500">{employee?.role} ({employee?.department})</div>
              </div>
            </div>

            {/* SOC Return */}
            <Link href="/dashboard" className="text-xs text-slate-400 hover:text-blue-400 transition-colors flex items-center gap-1">
              <Shield className="w-3.5 h-3.5" /> SOC
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto px-6 py-6 gap-6 relative z-10">
        
        {/* SIDEBAR NAVIGATION */}
        <aside className="w-64 flex-shrink-0 hidden lg:flex flex-col justify-between p-1 bg-slate-900/60 border border-slate-850 rounded-2xl backdrop-blur-md">
          <div className="p-3 space-y-1.5">
            <div className="px-3 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Workspace tabs</div>
            
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10'
                  : 'text-slate-400 hover:text-white hover:bg-slate-850'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" /> Dashboard
            </button>

            <button
              onClick={() => setActiveTab('files')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                activeTab === 'files'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10'
                  : 'text-slate-400 hover:text-white hover:bg-slate-850'
              }`}
            >
              <FolderClosed className="w-4 h-4" /> My Files
            </button>

            <button
              onClick={() => setActiveTab('emails')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                activeTab === 'emails'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10'
                  : 'text-slate-400 hover:text-white hover:bg-slate-850'
              }`}
            >
              <Mail className="w-4 h-4" /> Email Center
            </button>

            <button
              onClick={() => setActiveTab('meetings')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                activeTab === 'meetings'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10'
                  : 'text-slate-400 hover:text-white hover:bg-slate-850'
              }`}
            >
              <Video className="w-4 h-4" /> Meetings
            </button>

            <button
              onClick={() => setActiveTab('activity')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                activeTab === 'activity'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10'
                  : 'text-slate-400 hover:text-white hover:bg-slate-850'
              }`}
            >
              <Activity className="w-4 h-4" /> Recent Activity
            </button>

            <button
              onClick={() => setActiveTab('notifications')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                activeTab === 'notifications'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10'
                  : 'text-slate-400 hover:text-white hover:bg-slate-850'
              }`}
            >
              <div className="relative">
                <Bell className="w-4 h-4" />
                {notifications.length > 0 && <span className="absolute -top-1.5 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-slate-900 shadow"></span>}
              </div>
              Notifications
            </button>

            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                activeTab === 'profile'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10'
                  : 'text-slate-400 hover:text-white hover:bg-slate-850'
              }`}
            >
              <User className="w-4 h-4" /> Profile
            </button>
          </div>

          <div className="p-3 border-t border-slate-850/80">
            <button
              onClick={handlePortalLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
            >
              <LogOut className="w-4 h-4" /> Log Out Station
            </button>
          </div>
        </aside>

        {/* WORKSPACE VIEW CONTENT AREA */}
        <main className="flex-1 flex flex-col bg-slate-900/40 border border-slate-850 rounded-2xl p-6 relative min-h-[550px] overflow-hidden shadow-2xl">
          
          {/* Notification Toasts/Alerts */}
          {error && (
            <div className="mb-6 p-4 bg-red-950/40 border border-red-800/30 text-red-400 text-xs rounded-xl flex items-center gap-2 animate-fadeIn relative z-10">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-6 p-4 bg-emerald-950/40 border border-emerald-800/30 text-emerald-400 text-xs rounded-xl flex items-center gap-2 animate-fadeIn relative z-10">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* VIEW: DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Welcome Card */}
              <div className="p-6 bg-gradient-to-tr from-slate-900 via-slate-900 to-slate-850 border border-slate-850 rounded-2xl shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-1">
                  <h2 className="text-xl font-bold text-white">Welcome Back, {employee?.name}!</h2>
                  <p className="text-xs text-slate-400">Manage files, check internal mails, and sync with your department.</p>
                </div>
                <div className="flex items-center gap-2 bg-slate-950 border border-slate-850/80 px-3 py-1.5 rounded-xl">
                  <MapPin className="w-3.5 h-3.5 text-blue-400" />
                  <span className="text-[10px] font-bold text-slate-300">Station Active: <span className="text-white">{simulatedLocation}</span></span>
                </div>
              </div>

              {/* Grid: Station Details and Stats summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Station Details */}
                <div className="bg-slate-950/60 border border-slate-850 rounded-2xl p-5 space-y-4">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-slate-850 pb-2 flex items-center gap-1.5">
                    <Laptop className="w-4 h-4 text-blue-400" /> Workstation Telemetry
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="block text-[10px] text-slate-500 uppercase tracking-wider">Device OS</span>
                      <span className="font-semibold text-slate-200">{osName} Workstation</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-500 uppercase tracking-wider">Browser</span>
                      <span className="font-semibold text-slate-200">{browserName} Client</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-500 uppercase tracking-wider">Session Time</span>
                      <span className="font-semibold text-slate-200">
                        {sessionStart ? new Date(sessionStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-500 uppercase tracking-wider">Elapsed Time</span>
                      <span className="font-mono font-bold text-blue-400">{elapsedTime}</span>
                    </div>
                  </div>
                </div>

                {/* Quick actions panel */}
                <div className="bg-slate-950/60 border border-slate-850 rounded-2xl p-5 space-y-3">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-slate-850 pb-2">Quick Actions</h3>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setActiveTab('files')}
                      className="p-3 bg-slate-900 border border-slate-850 hover:bg-slate-850 rounded-xl text-xs text-left font-medium text-slate-200 flex flex-col gap-1.5 transition-all"
                    >
                      <FolderClosed className="w-4 h-4 text-blue-400" />
                      <span>Upload File</span>
                    </button>

                    <button
                      onClick={() => setActiveTab('emails')}
                      className="p-3 bg-slate-900 border border-slate-850 hover:bg-slate-850 rounded-xl text-xs text-left font-medium text-slate-200 flex flex-col gap-1.5 transition-all"
                    >
                      <Mail className="w-4 h-4 text-purple-400" />
                      <span>Compose Email</span>
                    </button>

                    <button
                      onClick={() => setActiveTab('meetings')}
                      className="p-3 bg-slate-900 border border-slate-850 hover:bg-slate-850 rounded-xl text-xs text-left font-medium text-slate-200 flex flex-col gap-1.5 transition-all"
                    >
                      <Video className="w-4 h-4 text-emerald-400" />
                      <span>Join Meeting</span>
                    </button>

                    <button
                      onClick={() => setActiveTab('profile')}
                      className="p-3 bg-slate-900 border border-slate-850 hover:bg-slate-850 rounded-xl text-xs text-left font-medium text-slate-200 flex flex-col gap-1.5 transition-all"
                    >
                      <User className="w-4 h-4 text-amber-400" />
                      <span>Profile Settings</span>
                    </button>
                  </div>
                </div>

              </div>

              {/* Workstation Activity Summary (Strictly no trust score details) */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Session Activity Summary</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  
                  <div className="bg-slate-950/40 border border-slate-850 rounded-2xl p-4 text-center">
                    <span className="block text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">Files Uploaded</span>
                    <span className="text-2xl font-bold text-white">{stats.filesUploaded}</span>
                  </div>

                  <div className="bg-slate-950/40 border border-slate-850 rounded-2xl p-4 text-center">
                    <span className="block text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">Files Downloaded</span>
                    <span className="text-2xl font-bold text-white">{stats.filesDownloaded}</span>
                  </div>

                  <div className="bg-slate-950/40 border border-slate-850 rounded-2xl p-4 text-center">
                    <span className="block text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">Emails Sent</span>
                    <span className="text-2xl font-bold text-white">{stats.emailsSent}</span>
                  </div>

                  <div className="bg-slate-950/40 border border-slate-850 rounded-2xl p-4 text-center">
                    <span className="block text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">Meetings Joined</span>
                    <span className="text-2xl font-bold text-white">{stats.meetingsJoined}</span>
                  </div>

                </div>
              </div>
            </div>
          )}

          {/* VIEW: MY FILES */}
          {activeTab === 'files' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-850">
                <div>
                  <h2 className="text-md font-bold text-white flex items-center gap-2">
                    <FolderClosed className="w-5 h-5 text-blue-500" /> Workstation Cloud Files
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">Upload and manage secure corporate document containers.</p>
                </div>
              </div>

              {/* Upload Panel */}
              <form onSubmit={handleUploadFileSubmit} className="bg-slate-950/60 border border-slate-850 rounded-2xl p-5 space-y-4">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Secure Document Upload Sandbox</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">File Name</label>
                    <input
                      type="text"
                      placeholder="quarterly_report.pdf"
                      value={dummyFileName}
                      onChange={(e) => setDummyFileName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">File Sandbox Type</label>
                    <div className="text-xs text-slate-400 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 flex items-center justify-between">
                      <span>Interactive base64 container</span>
                      <span className="text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/25 px-1.5 py-0.5 rounded uppercase">PDF / DOCX / TXT</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Document Mock Content</label>
                  <textarea
                    placeholder="Enter proprietary corporate document text..."
                    rows={3}
                    value={dummyFileContent}
                    onChange={(e) => setDummyFileContent(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-xs text-slate-100 focus:outline-none focus:border-blue-500 resize-none font-mono"
                  ></textarea>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="bg-blue-600 hover:bg-blue-500 text-white font-medium py-2 px-5 rounded-xl text-xs transition-colors flex items-center gap-1.5"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" /> Upload Document
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Uploaded Files Table */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">File Registry ({files.length} documents)</h3>
                
                {files.length === 0 ? (
                  <div className="p-8 border border-slate-850/60 bg-slate-950/20 rounded-2xl text-center text-xs text-slate-500">
                    No workstation documents created. Use the form above to upload a PDF or text file.
                  </div>
                ) : (
                  <div className="border border-slate-850 rounded-2xl overflow-hidden shadow-lg bg-slate-950/30">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-950 border-b border-slate-850 text-slate-400 font-bold uppercase tracking-wider">
                          <th className="p-3">File Name</th>
                          <th className="p-3">Size</th>
                          <th className="p-3">Upload Date</th>
                          <th className="p-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-850/50">
                        {files.map((file) => (
                          <tr key={file._id} className="hover:bg-slate-900/50 transition-colors">
                            <td className="p-3 font-semibold text-slate-200 flex items-center gap-2">
                              <FileText className="w-4 h-4 text-blue-400" /> {file.name}
                            </td>
                            <td className="p-3 text-slate-400">
                              {(file.size / 1024).toFixed(1)} KB
                            </td>
                            <td className="p-3 text-slate-500">
                              {new Date(file.uploadedAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                            </td>
                            <td className="p-3 text-right space-x-1.5">
                              <button
                                onClick={() => setSelectedFileMeta(file)}
                                className="px-2 py-1 bg-slate-900 border border-slate-800 text-[10px] rounded hover:bg-slate-800 hover:text-white transition-colors"
                              >
                                View Meta
                              </button>
                              <button
                                onClick={() => handleDownloadFile(file._id, file.name)}
                                className="px-2 py-1 bg-blue-900/20 border border-blue-500/20 text-blue-400 [10px] rounded hover:bg-blue-600 hover:text-white transition-colors inline-flex items-center gap-1 text-[10px]"
                              >
                                <Download className="w-3 h-3" /> Download
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* File Meta Modal */}
              {selectedFileMeta && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                  <div className="w-full max-w-md p-1 bg-gradient-to-tr from-slate-800 to-slate-900 rounded-2xl border border-slate-700">
                    <div className="bg-slate-950 p-6 rounded-2xl space-y-4">
                      <div className="flex justify-between items-center border-b border-slate-850 pb-3">
                        <h4 className="text-sm font-bold text-white flex items-center gap-2">
                          <Info className="w-4 h-4 text-blue-400" /> Secure File Metadata
                        </h4>
                        <button onClick={() => setSelectedFileMeta(null)} className="text-slate-500 hover:text-slate-300 text-xs">Close</button>
                      </div>

                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between border-b border-slate-850/50 pb-2">
                          <span className="text-slate-500">File Name</span>
                          <span className="text-slate-200 font-mono">{selectedFileMeta.name}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-850/50 pb-2">
                          <span className="text-slate-500">Mime Type</span>
                          <span className="text-slate-200 font-mono">{selectedFileMeta.mimeType}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-850/50 pb-2">
                          <span className="text-slate-500">Container Size</span>
                          <span className="text-slate-200">{selectedFileMeta.size} bytes</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-850/50 pb-2">
                          <span className="text-slate-500">Persistent ID</span>
                          <span className="text-slate-400 font-mono text-[9px]">{selectedFileMeta._id}</span>
                        </div>
                        <div className="flex justify-between pb-2">
                          <span className="text-slate-500">Sandbox Encryption Hash</span>
                          <span className="text-slate-400 font-mono text-[9px]">sha256:7f4c3a2b...</span>
                        </div>
                      </div>

                      <div className="bg-slate-900 p-3 rounded-lg border border-slate-850/60 max-h-[120px] overflow-y-auto">
                        <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Decrypted Sandbox Content Preview</div>
                        <pre className="text-[10px] text-slate-300 font-mono whitespace-pre-wrap">{selectedFileMeta.content || '[Empty container]'}</pre>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* VIEW: EMAIL CENTER */}
          {activeTab === 'emails' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="pb-4 border-b border-slate-850 flex items-center justify-between">
                <div>
                  <h2 className="text-md font-bold text-white flex items-center gap-2">
                    <Mail className="w-5 h-5 text-purple-400" /> Internal Email Node
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">Send and read cryptographically signed internal letters.</p>
                </div>
              </div>

              {/* Split layout */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Left column: Mail folders list */}
                <div className="space-y-4">
                  <div className="bg-slate-950/60 border border-slate-850 rounded-2xl p-4 flex flex-col gap-2">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-2 mb-1">Mail Folders</div>
                    
                    <button
                      onClick={() => { setActiveMail(null); }}
                      className="w-full text-left px-3 py-2 bg-slate-900 border border-slate-850 rounded-xl text-xs font-semibold text-white flex items-center gap-2 hover:bg-slate-850 transition-colors"
                    >
                      <Plus className="w-4 h-4 text-purple-400" /> Compose Message
                    </button>

                    <div className="border-t border-slate-850/60 my-2"></div>

                    <div className="space-y-1.5">
                      <div className="text-xs font-semibold text-slate-300 px-2 flex items-center gap-1.5"><Inbox className="w-3.5 h-3.5 text-slate-400" /> Inbox ({inbox.length})</div>
                      <div className="max-h-[140px] overflow-y-auto space-y-1 pr-1">
                        {inbox.map((mail) => (
                          <button
                            key={mail._id}
                            onClick={() => setActiveMail(mail)}
                            className={`w-full text-left p-2 rounded-lg text-[11px] truncate block ${
                              activeMail?._id === mail._id ? 'bg-purple-900/10 border border-purple-500/25 text-purple-200' : 'text-slate-400 hover:bg-slate-850/50'
                            }`}
                          >
                            <span className="font-semibold block truncate text-slate-200">{mail.subject}</span>
                            <span className="text-[9px] text-slate-500 block truncate">From: {mail.senderEmail}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1.5 mt-2">
                      <div className="text-xs font-semibold text-slate-300 px-2 flex items-center gap-1.5"><SendIcon className="w-3.5 h-3.5 text-slate-400" /> Sent Archive ({sentEmails.length})</div>
                      <div className="max-h-[140px] overflow-y-auto space-y-1 pr-1">
                        {sentEmails.map((mail) => (
                          <button
                            key={mail._id}
                            onClick={() => setActiveMail(mail)}
                            className={`w-full text-left p-2 rounded-lg text-[11px] truncate block ${
                              activeMail?._id === mail._id ? 'bg-purple-900/10 border border-purple-500/25 text-purple-200' : 'text-slate-400 hover:bg-slate-850/50'
                            }`}
                          >
                            <span className="font-semibold block truncate text-slate-200">{mail.subject}</span>
                            <span className="text-[9px] text-slate-500 block truncate">To: {mail.recipientEmail}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right columns: Message viewport */}
                <div className="md:col-span-2 bg-slate-950/40 border border-slate-850 rounded-2xl p-5 min-h-[300px] flex flex-col">
                  {activeMail ? (
                    // Read Email view
                    <div className="space-y-4 flex-1 flex flex-col">
                      <div className="border-b border-slate-850 pb-3 flex justify-between items-start gap-4">
                        <div>
                          <h3 className="text-sm font-bold text-white">{activeMail.subject}</h3>
                          <div className="text-[10px] text-slate-400 mt-1">From: <span className="font-mono text-slate-300">{activeMail.senderEmail}</span></div>
                          <div className="text-[10px] text-slate-400">To: <span className="font-mono text-slate-300">{activeMail.recipientEmail}</span></div>
                        </div>
                        <span className="text-[10px] text-slate-500">
                          {new Date(activeMail.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                        </span>
                      </div>
                      
                      <div className="flex-1 bg-slate-950/60 p-4 rounded-xl border border-slate-850/80 text-xs text-slate-300 whitespace-pre-wrap leading-relaxed font-sans">
                        {activeMail.message}
                      </div>

                      <div className="flex justify-end border-t border-slate-850/80 pt-3">
                        <button
                          onClick={() => setActiveMail(null)}
                          className="px-4 py-1.5 bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-white rounded-lg text-xs transition-colors border border-slate-800"
                        >
                          Back to Compose
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Compose form view
                    <form onSubmit={handleSendEmail} className="space-y-4 flex-1 flex flex-col justify-between">
                      <div className="space-y-4">
                        <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                          <Send className="w-3.5 h-3.5 text-purple-400" /> New Secure Correspondence
                        </h3>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Recipient (To)</label>
                            <select
                              value={emailTo}
                              onChange={(e) => setEmailTo(e.target.value)}
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 appearance-none cursor-pointer"
                            >
                              {employeesList.filter((e) => e._id !== employeeId).map((emp) => (
                                <option key={emp._id} value={emp.email}>
                                  {emp.name} ({emp.email})
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Subject</label>
                            <input
                              type="text"
                              placeholder="Project Status Update"
                              value={emailSubject}
                              onChange={(e) => setEmailSubject(e.target.value)}
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                              required
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Message</label>
                          <textarea
                            placeholder="Write message contents..."
                            rows={6}
                            value={emailMessage}
                            onChange={(e) => setEmailMessage(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-xs text-slate-100 focus:outline-none focus:border-blue-500 resize-none font-sans"
                            required
                          ></textarea>
                        </div>
                      </div>

                      <div className="flex justify-end pt-4 border-t border-slate-850/60">
                        <button
                          type="submit"
                          disabled={submitting}
                          className="bg-blue-600 hover:bg-blue-500 text-white font-medium py-2 px-5 rounded-xl text-xs transition-colors flex items-center gap-1.5"
                        >
                          {submitting ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Dispatching...
                            </>
                          ) : (
                            <>
                              <Send className="w-3.5 h-3.5" /> Dispatch Mail
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  )}
                </div>

              </div>

            </div>
          )}

          {/* VIEW: MEETINGS */}
          {activeTab === 'meetings' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="pb-4 border-b border-slate-850 flex justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-md font-bold text-white flex items-center gap-2">
                    <Video className="w-5 h-5 text-emerald-400" /> Workstation Meeting Hub
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">Join department conference nodes to coordinate operational updates.</p>
                </div>
              </div>

              {/* Meetings List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {meetings.map((meeting) => (
                  <div
                    key={meeting._id}
                    className="p-5 bg-slate-950/60 border border-slate-850 rounded-2xl flex flex-col justify-between gap-4"
                  >
                    <div className="space-y-2">
                      <div className="flex justify-between items-start gap-3">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          {meeting.department}
                        </span>
                        <span className="text-[10px] text-slate-500 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-650" /> {meeting.date}
                        </span>
                      </div>
                      <h3 className="font-bold text-slate-200 text-sm leading-snug">{meeting.name}</h3>
                      <p className="text-[11px] text-slate-400">Scheduled Time: <strong className="text-slate-300 font-mono">{meeting.time}</strong></p>
                    </div>

                    <button
                      onClick={() => handleJoinMeeting(meeting._id, meeting.name)}
                      disabled={submitting}
                      className="w-full py-2 bg-slate-900 border border-slate-800 hover:bg-slate-850 rounded-xl text-xs font-semibold text-slate-200 transition-all flex items-center justify-center gap-1.5 hover:border-slate-700"
                    >
                      <Video className="w-4 h-4 text-emerald-400" /> Connect Conference Node
                    </button>
                  </div>
                ))}
              </div>

              {/* Meeting Conference Active overlay */}
              {selectedMeeting && (
                <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
                  <div className="w-full max-w-2xl bg-slate-950 border border-slate-850 rounded-3xl overflow-hidden shadow-2xl">
                    <div className="p-4 bg-slate-900/90 border-b border-slate-850/80 flex justify-between items-center px-6">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></div>
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider">{selectedMeeting.name} — Live</h4>
                      </div>
                      <button
                        onClick={() => setSelectedMeeting(null)}
                        className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-lg text-[10px] transition-colors"
                      >
                        Disconnect Node
                      </button>
                    </div>

                    {/* Mock Call Grid */}
                    <div className="p-6 bg-slate-950 grid grid-cols-2 gap-4 aspect-video">
                      <div className="bg-slate-900 rounded-2xl border border-slate-800 flex items-center justify-center relative overflow-hidden">
                        <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20 text-blue-400 font-bold text-xs uppercase shadow-inner">
                          {employee?.name?.charAt(0)}
                        </div>
                        <span className="absolute bottom-2.5 left-2.5 text-[9px] bg-black/60 px-2 py-0.5 rounded text-white font-mono">{employee?.name} (You)</span>
                      </div>

                      <div className="bg-slate-900 rounded-2xl border border-slate-800 flex items-center justify-center relative overflow-hidden">
                        <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center border border-purple-500/20 text-purple-400 font-bold text-xs uppercase shadow-inner">
                          A
                        </div>
                        <span className="absolute bottom-2.5 left-2.5 text-[9px] bg-black/60 px-2 py-0.5 rounded text-white font-mono">Audrey (Facilitator)</span>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-900/90 border-t border-slate-850/80 text-center text-[10px] text-slate-500">
                      AES-256 encrypted peer-to-peer workspace session.
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* VIEW: RECENT ACTIVITY (Strictly no trust assessment metrics) */}
          {activeTab === 'activity' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="pb-4 border-b border-slate-850">
                <h2 className="text-md font-bold text-white flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-500" /> Workstation Audit Timeline
                </h2>
                <p className="text-xs text-slate-500 mt-1">Audit log of actions dispatched from this sandbox workstation.</p>
              </div>

              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                {logs.length === 0 ? (
                  <div className="p-8 border border-slate-850 bg-slate-950/20 rounded-2xl text-center text-xs text-slate-500 animate-pulse">
                    No actions logged for this workspace session.
                  </div>
                ) : (
                  logs.map((log: any) => (
                    <div
                      key={log._id}
                      className="p-4 bg-slate-950/60 border border-slate-850 rounded-2xl flex justify-between items-center text-xs hover:bg-slate-900/50 transition-colors"
                    >
                      <div className="space-y-1.5">
                        <span className="font-bold text-slate-200 block text-xs">{log.action}</span>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-slate-500">
                          <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-slate-650" /> {log.location || 'Unknown'}</span>
                          <span className="flex items-center gap-1"><Monitor className="w-3 h-3 text-slate-650" /> {log.device || 'Corporate Laptop'}</span>
                          {log.sessionDuration !== undefined && log.action === 'Logout' && (
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-slate-650" /> Duration: {log.sessionDuration} mins</span>
                          )}
                        </div>
                      </div>
                      
                      <span className="text-[10px] text-slate-500 font-mono flex-shrink-0">
                        {new Date(log.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'medium' })}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* VIEW: NOTIFICATIONS */}
          {activeTab === 'notifications' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="pb-4 border-b border-slate-850">
                <h2 className="text-md font-bold text-white flex items-center gap-2">
                  <Bell className="w-5 h-5 text-amber-400" /> Company Notification Desk
                </h2>
                <p className="text-xs text-slate-500 mt-1">Official internal announcements, policy briefings, and maintenance alerts.</p>
              </div>

              <div className="space-y-4">
                {notifications.map((n) => {
                  let badgeColor = 'text-blue-400 bg-blue-500/10 border-blue-500/20';
                  if (n.type === 'security') badgeColor = 'text-red-400 bg-red-500/10 border-red-500/20';
                  if (n.type === 'reminder') badgeColor = 'text-amber-400 bg-amber-500/10 border-amber-500/20';
                  if (n.type === 'maintenance') badgeColor = 'text-purple-400 bg-purple-500/10 border-purple-500/20';

                  return (
                    <div
                      key={n._id}
                      className="p-5 bg-slate-950/60 border border-slate-850 rounded-2xl flex flex-col sm:flex-row items-start gap-4"
                    >
                      <div className="flex-1 space-y-2">
                        <div className="flex justify-between items-start gap-3">
                          <span className={`text-[9px] font-bold uppercase tracking-wider border px-2 py-0.5 rounded ${badgeColor}`}>
                            {n.type}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {new Date(n.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </div>
                        <h3 className="font-bold text-slate-200 text-sm leading-snug">{n.title}</h3>
                        <p className="text-xs text-slate-400 leading-relaxed font-sans">{n.message}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* VIEW: PROFILE */}
          {activeTab === 'profile' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="pb-4 border-b border-slate-850">
                <h2 className="text-md font-bold text-white flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-400" /> Employee Profile
                </h2>
                <p className="text-xs text-slate-500 mt-1">Review authenticated personnel directory profile details.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Profile detail card */}
                <div className="md:col-span-2 bg-slate-950/60 border border-slate-850 rounded-2xl p-5 space-y-4">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-slate-850 pb-2">Employee Directory Records</h3>
                  
                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between border-b border-slate-850/50 pb-2.5">
                      <span className="text-slate-500 font-semibold">Full Name</span>
                      <span className="text-slate-200 font-bold">{employee?.name}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-850/50 pb-2.5">
                      <span className="text-slate-500 font-semibold">Department</span>
                      <span className="text-slate-200">{employee?.department}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-850/50 pb-2.5">
                      <span className="text-slate-500 font-semibold">Corporate Role</span>
                      <span className="text-slate-200">{employee?.role}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-850/50 pb-2.5">
                      <span className="text-slate-500 font-semibold">Email ID</span>
                      <span className="text-blue-400 font-mono">{employee?.email}</span>
                    </div>
                    <div className="flex justify-between pb-1">
                      <span className="text-slate-500 font-semibold">Directory ID</span>
                      <span className="text-slate-400 font-mono text-[9px]">{employee?._id}</span>
                    </div>
                  </div>
                </div>

                {/* Session telemetry summary */}
                <div className="bg-slate-950/60 border border-slate-850 rounded-2xl p-5 space-y-4">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-slate-850 pb-2">Active Session Details</h3>
                  
                  <div className="space-y-3 text-[11px] text-slate-400">
                    <div className="flex justify-between border-b border-slate-850/40 pb-2">
                      <span>Gateway IP</span>
                      <span className="font-mono text-slate-300">192.168.1.100</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-850/40 pb-2">
                      <span>Assigned VPN Node</span>
                      <span className="font-mono text-slate-300">us-west.vpn.insidershield.local</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-850/40 pb-2">
                      <span>Workstation Location</span>
                      <span className="text-slate-200 font-semibold">{simulatedLocation}</span>
                    </div>
                    <div className="flex justify-between pb-1">
                      <span>Session Duration</span>
                      <span className="font-mono text-slate-350">{elapsedTime}</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

        </main>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/60 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p>© 2026 InsiderShield Corporation. Proprietary Workspace Environment.</p>
          <div className="flex gap-4 text-[10px] text-slate-650">
            <span>Workstation ID: WS-90823</span>
            <span>Client Version: 2.14.0-desktop</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
