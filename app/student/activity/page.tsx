'use client';

import React, { useEffect, useState } from 'react';
import { History, Clock, FileText } from 'lucide-react';
import { StatusBadge } from '@/components/ui/StatusBadge';

export default function StudentActivityPage() {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadActivity() {
      try {
        const res = await fetch('/api/activity/me');
        if (res.ok) {
          const d = await res.json();
          setActivities(d.activities || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadActivity();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-900">Activity History & Audit Log</h2>
        <p className="text-xs text-slate-500">
          Source of truth: MongoDB collection <code className="text-slate-700 bg-slate-100 px-1 py-0.5 rounded">activity_logs</code> (Secondary NoSQL Database Paradigm)
        </p>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-xs text-slate-500">Loading audit history from MongoDB...</div>
        ) : activities.length === 0 ? (
          <div className="py-20 text-center text-xs text-slate-400">
            No logged activity events recorded yet. Perform an action like adding a skill or submitting an application to generate events.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {activities.map((act, idx) => (
              <div key={idx} className="p-4 hover:bg-slate-50/50 transition-colors flex items-start space-x-3">
                <div className="mt-1 w-7 h-7 rounded bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                  <Clock className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <StatusBadge status={act.eventType} />
                    <span className="text-[11px] font-mono text-slate-400">
                      {new Date(act.timestamp).toLocaleString()}
                    </span>
                  </div>

                  {act.metadata && (
                    <div className="mt-2 text-xs text-slate-600 bg-slate-50 p-2 rounded border border-slate-200 font-mono">
                      {JSON.stringify(act.metadata, null, 2)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-4 bg-slate-50 border border-slate-200 rounded text-xs text-slate-500">
        <span className="font-semibold text-slate-700">Architecture Note:</span> Relational state remains stored in MySQL with transaction guarantees, while application events are streamed to MongoDB for temporal activity tracking and aggregation.
      </div>
    </div>
  );
}
