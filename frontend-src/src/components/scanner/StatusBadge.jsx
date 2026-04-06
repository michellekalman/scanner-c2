import { cn } from "@/lib/utils";

const statusConfig = {
  pending:   { label: 'Pending',   bg: 'bg-neon-orange/15', text: 'text-neon-orange', dot: 'bg-neon-orange' },
  running:   { label: 'Running',   bg: 'bg-neon-blue/15',   text: 'text-neon-blue',   dot: 'bg-neon-blue', pulse: true },
  completed: { label: 'Completed', bg: 'bg-neon-green/15',  text: 'text-neon-green',  dot: 'bg-neon-green' },
  failed:    { label: 'Failed',    bg: 'bg-neon-red/15',    text: 'text-neon-red',    dot: 'bg-neon-red' },
  cancelled: { label: 'Cancelled', bg: 'bg-muted-foreground/15', text: 'text-muted-foreground', dot: 'bg-muted-foreground' },
};

export default function StatusBadge({ status }) {
  const s = status?.toLowerCase();
  const config = statusConfig[s] || statusConfig.pending;

  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-medium tracking-wide",
      config.bg, config.text
    )}>
      <span className={cn(
        "w-1.5 h-1.5 rounded-full",
        config.dot,
        config.pulse && "animate-pulse-neon"
      )} />
      {config.label}
    </span>
  );
}