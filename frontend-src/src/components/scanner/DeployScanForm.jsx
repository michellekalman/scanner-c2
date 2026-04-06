import React, { useState } from 'react';
import { Rocket, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { apiPost } from "@/lib/apiClient";

const defaultForm = {
  target: '',
  subnets_s3_url: '',
  subnets_manual: '',
  ports_s3_url: '',
  fleet_size: 5,
  masscan_rate: 1000,
  partitions: 10,
};

export default function DeployScanForm() {
  const [form, setForm] = useState(defaultForm);
  const [deploying, setDeploying] = useState(false);
  const [subnetsMode, setSubnetsMode] = useState('s3');

  const set = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  async function handleSubmit(e) {
    // 1. Stop the browser from doing its own thing
    e.preventDefault();
    console.log("Submit pressed. Current mode:", subnetsMode); // Debugging log

    // 2. Manual Validation
    const target = form.target?.trim() || '';
    if (!target) {
      toast.error('Target Name is required');
      return;
    }

    if (subnetsMode === 's3') {
      const s3Url = form.subnets_s3_url?.trim() || '';
      if (!s3Url) {
        toast.error('Please provide an S3 URL for subnets');
        return;
      }
    } else {
      const manualText = form.subnets_manual?.trim() || '';
      if (!manualText) {
        toast.error('Please enter at least one subnet manually');
        return;
      }
    }

    setDeploying(true);

    try {
      const payload = {
        target: target,
        ports_s3_url: (form.ports_s3_url || '').trim(),
        fleet_size: Number(form.fleet_size),
        masscan_rate: Number(form.masscan_rate),
        partitions: Number(form.partitions),
      };

      if (subnetsMode === 's3') {
        payload.subnets_s3_url = form.subnets_s3_url.trim();
        payload.manual_subnets = null;
      } else {
        payload.manual_subnets = form.subnets_manual
          .split(/[,\n]/)
          .map(item => item.trim())
          .filter(item => item !== '');
        payload.subnets_s3_url = null;
      }

      console.log("Sending payload:", payload);
      await apiPost('/v1/scan', payload);

      toast.success('Fleet deployed successfully');
      setForm(defaultForm);
    } catch (err) {
      console.error("Submission Error:", err);
      toast.error('Deployment failed', {
        description: err.message || 'Check connection to API',
      });
    } finally {
      setDeploying(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Target Name */}
      <div className="space-y-1.5">
        <Label htmlFor="target_name" className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
          Target Name
        </Label>
        <Input
          id="target_name"
          placeholder="e.g. production-web-scan"
          value={form.target}
          onChange={e => set('target', e.target.value)}
          className="bg-secondary/50 border-border/60 font-mono text-sm h-10"
          // DO NOT ADD 'required' HERE
        />
      </div>

      {/* Subnets Section */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Subnets</Label>
          <div className="flex items-center gap-0.5 bg-secondary rounded-md p-0.5">
            <button
              type="button"
              onClick={() => setSubnetsMode('s3')}
              className={`px-2.5 py-1 rounded text-xs font-mono transition-all ${
                subnetsMode === 's3' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
              }`}
            >
              S3 URL
            </button>
            <button
              type="button"
              onClick={() => setSubnetsMode('manual')}
              className={`px-2.5 py-1 rounded text-xs font-mono transition-all ${
                subnetsMode === 'manual' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
              }`}
            >
              Manual
            </button>
          </div>
        </div>

        {subnetsMode === 's3' ? (
          <Input
            placeholder="s3://bucket/subnets.txt"
            value={form.subnets_s3_url}
            onChange={e => set('subnets_s3_url', e.target.value)}
            className="bg-secondary/50 border-border/60 font-mono text-sm h-10"
          />
        ) : (
          <textarea
            placeholder={"10.0.0.0/8, 192.168.1.0/24\n(New lines or commas allowed)"}
            value={form.subnets_manual}
            onChange={e => set('subnets_manual', e.target.value)}
            rows={4}
            className="w-full bg-secondary/50 border border-border/60 rounded-md font-mono text-sm p-2.5 resize-none focus:ring-1 focus:ring-primary/40 focus:outline-none"
          />
        )}
      </div>

      {/* Ports URL */}
      <div className="space-y-1.5">
        <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Ports S3 URL</Label>
        <Input
          placeholder="s3://bucket/ports.txt"
          value={form.ports_s3_url}
          onChange={e => set('ports_s3_url', e.target.value)}
          className="bg-secondary/50 border-border/60 font-mono text-sm h-10"
        />
      </div>

      {/* Grid Inputs */}
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Fleet</Label>
          <Input
            type="number"
            value={form.fleet_size}
            onChange={e => set('fleet_size', e.target.value)}
            className="bg-secondary/50 border-border/60 font-mono text-sm h-10"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Rate</Label>
          <Input
            type="number"
            value={form.masscan_rate}
            onChange={e => set('masscan_rate', e.target.value)}
            className="bg-secondary/50 border-border/60 font-mono text-sm h-10"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Partitions</Label>
          <Input
            type="number"
            value={form.partitions}
            onChange={e => set('partitions', e.target.value)}
            className="bg-secondary/50 border-border/60 font-mono text-sm h-10"
          />
        </div>
      </div>

      <Button
        type="submit"
        disabled={deploying}
        className="w-full h-11 bg-primary text-primary-foreground font-mono font-semibold text-sm transition-all hover:shadow-lg"
      >
        {deploying ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Rocket className="w-4 h-4 mr-2" />}
        {deploying ? 'Deploying Fleet...' : 'Deploy Axiom Fleet'}
      </Button>
    </form>
  );
}