import { Outlet } from 'react-router-dom';
import { Shield } from 'lucide-react';

export default function Layout() {
  return (
    <div className="min-h-screen bg-background">
      {/* Top nav */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center glow-green-sm">
              <Shield className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h1 className="text-sm font-semibold tracking-tight text-foreground leading-none">
                Axiom Scanner
              </h1>
              <p className="text-[10px] font-mono uppercase tracking-widest text-primary/70 leading-none mt-0.5">
                Control Hub
              </p>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-neon" />
              <span className="text-[10px] font-mono uppercase tracking-wider text-primary">Live</span>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Outlet />
      </main>
    </div>
  );
}