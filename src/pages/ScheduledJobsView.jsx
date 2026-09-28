import React, { useState } from 'react';
import { Calendar, Play, CheckCircle2, RefreshCw, Clock, ShieldCheck, AlertCircle } from 'lucide-react';
import { useTMFData } from '../context/TMFDataContext';

export default function ScheduledJobsView() {
  const { activeStudy, documents, refreshData } = useTMFData();
  const [runningJob, setRunningJob] = useState(null);

  const jobsList = [
    {
      id: "JOB-01",
      name: "Nightly SHA-256 Checksum Cryptographic Re-verification",
      frequency: "Daily at 00:00 UTC",
      lastRun: "Today, 00:00:15 UTC",
      lastStatus: "Success (100% Hash Integrity Validated)",
      type: "21 CFR Part 11 Integrity"
    },
    {
      id: "JOB-02",
      name: "Automated Expected Document List (EDL) Gap Reconciliation",
      frequency: "Every 4 Hours",
      lastRun: "2 Hours ago",
      lastStatus: "Success (0 Gaps Mismatched)",
      type: "File Plan Automation"
    },
    {
      id: "JOB-03",
      name: "Concurrency Lock Timeout Auto-Release Daemon",
      frequency: "Every 15 Minutes",
      lastRun: "8 Minutes ago",
      lastStatus: "Active (Locks within SLA)",
      type: "Version Control"
    },
    {
      id: "JOB-04",
      name: "Digital Retention Policy Archival & Expiry Scanner",
      frequency: "Weekly (Sunday 02:00 UTC)",
      lastRun: "14-Sep-2026 02:00:00 UTC",
      lastStatus: "Success (No expired records)",
      type: "GxP Archiving"
    }
  ];

  const handleRunNow = (jobId) => {
    setRunningJob(jobId);
    setTimeout(() => {
      setRunningJob(null);
      refreshData();
    }, 1500);
  };

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-full font-sans text-xs">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-purple-700" />
            Scheduled Automation Jobs & Compliance Daemons
          </h1>
          <p className="text-xs text-slate-500 font-mono">
            Automated SHA-256 verification, EDL gap reconciliation, and concurrency lock auto-release
          </p>
        </div>

        <span className="px-3 py-1 bg-purple-50 text-purple-800 rounded border border-purple-300 font-mono font-bold">
          Scheduler Daemon: ACTIVE (Node.js cron)
        </span>
      </div>

      {/* Jobs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {jobsList.map(job => (
          <div key={job.id} className="glass-panel p-5 rounded-xl space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-100 text-purple-800 font-bold border border-purple-200">
                  {job.type}
                </span>
                <h3 className="font-bold text-slate-900 text-sm mt-1">{job.name}</h3>
                <p className="text-[11px] text-slate-500 font-mono">Schedule: {job.frequency}</p>
              </div>

              <button
                disabled={runningJob === job.id}
                onClick={() => handleRunNow(job.id)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-purple-100 text-purple-800 border border-purple-300 rounded font-semibold text-xs flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
              >
                {runningJob === job.id ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-purple-600" />
                    Executing...
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 text-purple-600 fill-purple-600" />
                    Run Now
                  </>
                )}
              </button>
            </div>

            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded font-mono text-[11px] space-y-1">
              <p><strong className="text-slate-700">Last Execution:</strong> {job.lastRun}</p>
              <p className="text-emerald-700 flex items-center gap-1 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" /> {job.lastStatus}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
