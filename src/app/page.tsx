"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Shield, Lock } from 'lucide-react';
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/20 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/20 rounded-full blur-[120px]"></div>

      <div className="z-10 w-full max-w-md p-8 glass-panel">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-4 border border-blue-100 shadow-sm">
            <Shield className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">InsiderShield</h1>
          <p className="text-slate-500 mt-2 text-sm">Enterprise Threat Detection Platform</p>
        </div>

        <form className="space-y-4">
          <div>
            <label htmlFor="admin-email" className="block text-sm font-medium text-slate-700 mb-1">Admin</label>
            <input 
              id="admin-email"
              data-testid="admin-email-input"
              type="text" 
              className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-sm"
              placeholder="admin@insidershield.local"
              defaultValue="admin@insidershield.local"
            />
          </div>
          <div>
            <label htmlFor="admin-password" className="block text-sm font-medium text-slate-700 mb-1">Access Token</label>
            <div className="relative">
              <input 
                id="admin-password"
                data-testid="admin-password-input"
                type={showPassword ? "text" : "password"}
                className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-sm"
                placeholder="••••••••••••"
                defaultValue="password123"
              />
              {/* <Lock className="w-4 h-4 text-slate-400 absolute right-3 top-3.5" /> */}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 transition-colors"
              >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
            </div>
          </div>
          
          <Link href="/dashboard" className="block mt-6" data-testid="admin-submit-link">
            <button type="button" data-testid="admin-submit-button" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-all shadow-[0_4px_14px_0_rgba(37,99,235,0.39)] hover:shadow-[0_6px_20px_rgba(37,99,235,0.23)] hover:-translate-y-0.5">
              Authenticate
            </button>
          </Link>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-500 flex items-center justify-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse"></span>
            SOC Systems Operational
          </p>
        </div>
      </div>
    </div>
  );
}
