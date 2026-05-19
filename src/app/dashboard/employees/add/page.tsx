"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function AddEmployee() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    department: "",
    role: "",
    email: "",
    trustedDevices: "Corporate Laptop",
    normalLoginHourRange: "09:00-17:00",
    normalLocation: "Office",
    normalDownloads: 5,
    normalFilesAccessed: 20,
    normalSessionDuration: 480,
    usualIPs: "192.168.1.100",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok) {
        router.push("/dashboard/employees");
      } else {
        setError(data.error || "Failed to add employee. Please try again.");
      }
    } catch {
      setError("Network error. Please check your connection.");
    }
    setLoading(false);
  };

  const inputClass = "w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all";
  const labelClass = "block text-sm font-medium text-slate-700 mb-1.5";

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/employees">
          <button className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <UserPlus className="w-6 h-6 text-blue-600" />
            Add New Employee
          </h1>
          <p className="text-sm text-slate-500 mt-1">Initialize a new employee profile and behavioral baseline</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-8">
        <form onSubmit={handleSubmit} className="space-y-8">

          {/* Basic Info */}
          <div>
            <h3 className="text-base font-semibold text-slate-900 pb-3 mb-4 border-b border-slate-100">
              Basic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Full Name <span className="text-red-500">*</span></label>
                <input required type="text" name="name" value={formData.name} onChange={handleChange} className={inputClass} placeholder="Jane Smith" />
              </div>
              <div>
                <label className={labelClass}>Email</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} className={inputClass} placeholder="jane.smith@company.com" />
              </div>
              <div>
                <label className={labelClass}>Department <span className="text-red-500">*</span></label>
                <input required type="text" name="department" value={formData.department} onChange={handleChange} className={inputClass} placeholder="Engineering" />
              </div>
              <div>
                <label className={labelClass}>Role <span className="text-red-500">*</span></label>
                <input required type="text" name="role" value={formData.role} onChange={handleChange} className={inputClass} placeholder="Software Engineer" />
              </div>
            </div>
          </div>

          {/* Behavioral Baseline */}
          <div>
            <h3 className="text-base font-semibold text-slate-900 pb-3 mb-4 border-b border-slate-100">
              Behavioral Baseline Configuration
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              These values define normal behavior for this employee. Deviations from these baselines will trigger anomaly scoring.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Trusted Devices <span className="text-xs text-slate-400">(comma-separated)</span></label>
                <input type="text" name="trustedDevices" value={formData.trustedDevices} onChange={handleChange} className={inputClass} placeholder="Corporate Laptop, iPhone 14" />
              </div>
              <div>
                <label className={labelClass}>Normal Login Hours</label>
                <input type="text" name="normalLoginHourRange" value={formData.normalLoginHourRange} onChange={handleChange} className={inputClass} placeholder="09:00-17:00" />
              </div>
              <div>
                <label className={labelClass}>Primary Work Location</label>
                <input type="text" name="normalLocation" value={formData.normalLocation} onChange={handleChange} className={inputClass} placeholder="New York, USA" />
              </div>
              <div>
                <label className={labelClass}>Usual IP Addresses <span className="text-xs text-slate-400">(comma-separated)</span></label>
                <input type="text" name="usualIPs" value={formData.usualIPs} onChange={handleChange} className={inputClass} placeholder="192.168.1.100" />
              </div>
              <div>
                <label className={labelClass}>Avg Daily Downloads <span className="text-xs text-slate-400">(files)</span></label>
                <input type="number" name="normalDownloads" value={formData.normalDownloads} onChange={handleChange} className={inputClass} min="0" />
              </div>
              <div>
                <label className={labelClass}>Avg Files Accessed Daily</label>
                <input type="number" name="normalFilesAccessed" value={formData.normalFilesAccessed} onChange={handleChange} className={inputClass} min="0" />
              </div>
              <div className="md:col-span-2">
                <label className={labelClass}>Normal Session Duration <span className="text-xs text-slate-400">(minutes)</span></label>
                <input type="number" name="normalSessionDuration" value={formData.normalSessionDuration} onChange={handleChange} className={inputClass} min="0" placeholder="480" />
              </div>
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <Link href="/dashboard/employees">
              <button type="button" className="px-5 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                Cancel
              </button>
            </Link>
            <button
              disabled={loading}
              type="submit"
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-lg transition-all shadow-sm hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Initializing...
                </span>
              ) : (
                "Initialize Employee Profile"
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
