import { Crosshair, Activity } from 'lucide-react';
import DeployScanForm from '../components/scanner/DeployScanForm';
import ScansFeed from '../components/scanner/ScansFeed';

export default function Dashboard() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Deploy New Scan */}
      <div className="lg:col-span-5 xl:col-span-4">
        <div className="rounded-xl border border-border/60 bg-card p-5 space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center">
              <Crosshair className="w-3.5 h-3.5 text-primary" />
            </div>
            <h2 className="text-sm font-semibold tracking-tight">Deploy New Scan</h2>
          </div>
          <div className="h-px bg-border/40" />
          <DeployScanForm />
        </div>
      </div>

      {/* Active & Recent Scans */}
      <div className="lg:col-span-7 xl:col-span-8">
        <div className="rounded-xl border border-border/60 bg-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-md bg-neon-blue/10 flex items-center justify-center">
                <Activity className="w-3.5 h-3.5 text-neon-blue" />
              </div>
              <h2 className="text-sm font-semibold tracking-tight">Active & Recent Scans</h2>
            </div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
              Auto-refresh 5s
            </span>
          </div>
          <div className="h-px bg-border/40" />
          <ScansFeed />
        </div>
      </div>
    </div>
  );
}