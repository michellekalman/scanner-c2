import { useState, useEffect, useRef, useCallback } from 'react';
import { RefreshCw, ChevronDown, AlertTriangle, Radar } from 'lucide-react';
import { Button } from "@/components/ui/button";
import StatusBadge from './StatusBadge';
import { apiGet } from "@/lib/apiClient";

const PAGE_SIZE = 20;

export default function ScansFeed() {
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const intervalRef = useRef(null);

  const fetchScans = useCallback(async (currentOffset, append = false) => {
    try {
      const data = await apiGet(`/v1/scans?limit=${PAGE_SIZE}&offset=${currentOffset}`);
      const list = Array.isArray(data) ? data : (data.scans || data.results || data.data || []);

      if (append) {
        setScans(prev => {
          const ids = new Set(prev.map(s => s.id));
          const newItems = list.filter(s => !ids.has(s.id));
          return [...prev, ...newItems];
        });
      } else {
        // Silent refresh: merge updates without resetting scroll
        setScans(prev => {
          if (prev.length === 0) return list;
          const merged = [...list];
          const freshIds = new Set(list.map(s => s.id));
          // Keep older paginated items that aren't in fresh data
          prev.forEach(s => { if (!freshIds.has(s.id)) merged.push(s); });
          return merged;
        });
      }

      setHasMore(list.length === PAGE_SIZE);
      setError(null);
    } catch (err) {
      if (!append) setError(err.message || 'Unable to reach scanner API');
    }
  }, []);

  // Initial load
  useEffect(() => {
    setLoading(true);
    fetchScans(0).finally(() => setLoading(false));
  }, [fetchScans]);

  // Auto-refresh every 5s (only refreshes first page)
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      fetchScans(0);
    }, 5000);
    return () => clearInterval(intervalRef.current);
  }, [fetchScans]);

  async function loadMore() {
    const nextOffset = offset + PAGE_SIZE;
    setLoadingMore(true);
    await fetchScans(nextOffset, true);
    setOffset(nextOffset);
    setLoadingMore(false);
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <RefreshCw className="w-6 h-6 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground font-mono">Loading scans...</p>
      </div>
    );
  }

  if (error && scans.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
        <div className="w-12 h-12 rounded-full bg-neon-red/10 flex items-center justify-center">
          <AlertTriangle className="w-6 h-6 text-neon-red" />
        </div>
        <p className="text-sm text-neon-red font-medium">API Unreachable</p>
        <p className="text-xs text-muted-foreground max-w-xs">{error}</p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => { setLoading(true); fetchScans(0).finally(() => setLoading(false)); }}
          className="mt-2 border-border/60 text-muted-foreground hover:text-foreground font-mono text-xs"
        >
          <RefreshCw className="w-3 h-3 mr-1.5" /> Retry
        </Button>
      </div>
    );
  }

  if (scans.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
          <Radar className="w-6 h-6 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground font-mono">No scans found</p>
        <p className="text-xs text-muted-foreground/70">Deploy a scan to get started</p>
      </div>
    );
  }

  return (
    <div>
      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/50">
              <th className="text-left py-2.5 px-3 text-xs font-mono uppercase tracking-wider text-muted-foreground font-medium">ID</th>
              <th className="text-left py-2.5 px-3 text-xs font-mono uppercase tracking-wider text-muted-foreground font-medium">Target</th>
              <th className="text-left py-2.5 px-3 text-xs font-mono uppercase tracking-wider text-muted-foreground font-medium">Status</th>
              <th className="text-left py-2.5 px-3 text-xs font-mono uppercase tracking-wider text-muted-foreground font-medium">Duration</th>
            </tr>
          </thead>
          <tbody>
            {scans.map((scan) => (
              <tr key={scan.id} className="border-b border-border/30 hover:bg-secondary/30 transition-colors">
                <td className="py-3 px-3 font-mono text-xs text-muted-foreground">{scan.id}</td>
                <td className="py-3 px-3 font-medium text-foreground">{scan.target || scan.target_name || '—'}</td>
                <td className="py-3 px-3"><StatusBadge status={scan.status} /></td>
                <td className="py-3 px-3 font-mono text-xs text-muted-foreground">{scan.duration || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-2">
        {scans.map((scan) => (
          <div key={scan.id} className="bg-secondary/30 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm text-foreground">{scan.target || scan.target_name || '—'}</span>
              <StatusBadge status={scan.status} />
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground font-mono">
              <span>ID: {scan.id}</span>
              <span>{scan.duration || '—'}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Load more */}
      {hasMore && (
        <div className="flex justify-center pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={loadMore}
            disabled={loadingMore}
            className="border-border/60 text-muted-foreground hover:text-foreground font-mono text-xs"
          >
            {loadingMore ? (
              <RefreshCw className="w-3 h-3 mr-1.5 animate-spin" />
            ) : (
              <ChevronDown className="w-3 h-3 mr-1.5" />
            )}
            Load Older Scans
          </Button>
        </div>
      )}

      {/* Error banner (non-blocking) */}
      {error && scans.length > 0 && (
        <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-neon-red/10 border border-neon-red/20">
          <AlertTriangle className="w-3.5 h-3.5 text-neon-red flex-shrink-0" />
          <p className="text-xs text-neon-red/80">Auto-refresh failed: {error}</p>
        </div>
      )}
    </div>
  );
}