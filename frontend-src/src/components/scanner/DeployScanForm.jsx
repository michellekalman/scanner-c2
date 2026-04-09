import React, { useState } from 'react';
import { Rocket, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { apiPost, apiGet } from "@/lib/apiClient";

const defaultForm = {
  target: '',
  subnets_s3_url: '',
  subnets_manual: '',
  ports_s3_url: '',
  ports_manual: '',
  fleet_size: 5,
  masscan_rate: 1000,
  partitions: 10,
};

export default function DeployScanForm() {
  const [form, setForm] = useState(defaultForm);
  const [deploying, setDeploying] = useState(false);
  const [subnetsMode, setSubnetsMode] = useState('s3');
  const [isLoadingSubnets, setIsLoadingSubnets] = useState(false);
  const [portsMode, setPortsMode] = useState('s3');
  const [isLoadingPorts, setIsLoadingPorts] = useState(false);

  const set = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  const handleFetchS3 = async (type) => {
    const isSubnets = type === 'subnets';
    const url = isSubnets ? form.subnets_s3_url : form.ports_s3_url;

    if (!url) {
      toast.error(`Please enter an S3 URL for ${type} first`);
      return;
    }

    isSubnets ? setIsLoadingSubnets(true) : setIsLoadingPorts(true);

    try {
      const response = await apiGet(`/api/v1/fetch-s3-content?url=${url}`);

      if (isSubnets) {
        set('subnets_manual', response.content);
        setSubnetsMode('manual');
      } else {
        set('ports_manual', response.content);
        setPortsMode('manual');
      }

      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} loaded! You can now edit them.`);
    } catch (err) {
      toast.error(`Failed to load ${type} from S3`, { description: err.message });
    } finally {
      isSubnets ? setIsLoadingSubnets(false) : setIsLoadingPorts(false);
    }
  };

  async function handleSubmit(e) {
    e.preventDefault();

    const target = form.target?.trim() || '';
    if (!target) {
      toast.error('Target Name is required');
      return;
    }

    if (subnetsMode === 's3' && !form.subnets_s3_url) return toast.error('S3 URL for subnets is required');
    if (subnetsMode === 'manual' && !form.subnets_manual) return toast.error('Manual subnets are required');
    if (portsMode === 's3' && !form.ports_s3_url) return toast.error('S3 URL for ports is required');
    if (portsMode === 'manual' && !form.ports_manual) return toast.error('Manual ports are required');

    setDeploying(true);

    try {
      const payload = {
        target: target,
        fleet_size: Number(form.fleet_size),
        masscan_rate: Number(form.masscan_rate),
        partitions: Number(form.partitions),
      };

      if (subnetsMode === 's3') {
        payload.subnets_s3_url = form.subnets_s3_url.trim();
        payload.manual_subnets = null;
      } else {
        payload.manual_subnets = form.subnets_manual.split(/[,\n]/).map(i => i.trim()).filter(i => i);
        payload.subnets_s3_url = null;
      }

      if (portsMode === 's3') {
        payload.ports_s3_url = form.ports_s3_url.trim();
        payload.manual_ports = null;
      } else {
        payload.manual_ports = form.ports_manual
          .split(/[,\n]/)
          .map(i => i.trim())
          .filter(i => i !== '')
          .map(Number);
        payload.ports_s3_url = null;
        }

      await apiPost('/v1/scan', payload);
      toast.success('Fleet deployed successfully');
      setForm(defaultForm);
    } catch (err) {
      toast.error('Deployment failed', { description: err.message });
    } finally {
      setDeploying(false);
    }
  }

  const renderModeToggle = (currentMode, setMode, label) => (
    <div className="flex items-center justify-between">
      <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">{label}</Label>
      <div className="flex items-center gap-0.5 bg-secondary rounded-md p-0.5">
        {['s3', 'manual'].map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`px-2.5 py-1 rounded text-xs font-mono transition-all ${
              currentMode === m ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
            }`}
          >
            {m === 's3' ? 'S3 URL' : 'Manual'}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Target Name */}
      <div className="space-y-1.5">
        <Label htmlFor="target_name" className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Target Name</Label>
        <Input
          id="target_name"
          placeholder="e.g. production-web-scan"
          value={form.target}
          onChange={e => set('target', e.target.value)}
          className="bg-secondary/50 border-border/60 font-mono text-sm h-10"
        />
      </div>

      {/* Subnets Section */}
      <div className="space-y-1.5">
        {renderModeToggle(subnetsMode, setSubnetsMode, "Subnets")}
        {subnetsMode === 's3' ? (
          <div className="flex gap-2">
            <Input
              placeholder="S3 URL for subnets..."
              value={form.subnets_s3_url}
              onChange={e => set('subnets_s3_url', e.target.value)}
              className="bg-secondary/50 border-border/60 font-mono text-sm h-10 flex-1"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => handleFetchS3('subnets')}
              disabled={isLoadingSubnets}
              className="h-10 border-primary/50 text-primary"
            >
              {isLoadingSubnets ? <Loader2 className="animate-spin w-4 h-4" /> : "Load"}
            </Button>
          </div>
        ) : (
          <textarea
            placeholder={"10.0.0.0/8, 192.168.1.0/24"}
            value={form.subnets_manual}
            onChange={e => set('subnets_manual', e.target.value)}
            rows={3}
            className="w-full bg-secondary/50 border border-border/60 rounded-md font-mono text-sm p-2.5 resize-none focus:outline-none"
          />
        )}
      </div>

      {/* Ports Section */}
      <div className="space-y-1.5">
        {renderModeToggle(portsMode, setPortsMode, "Ports")}
        {portsMode === 's3' ? (
          <div className="flex gap-2">
            <Input
              placeholder="S3 URL for ports..."
              value={form.ports_s3_url}
              onChange={e => set('ports_s3_url', e.target.value)}
              className="bg-secondary/50 border-border/60 font-mono text-sm h-10 flex-1"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => handleFetchS3('ports')}
              disabled={isLoadingPorts}
              className="h-10 border-primary/50 text-primary"
            >
              {isLoadingPorts ? <Loader2 className="animate-spin w-4 h-4" /> : "Load"}
            </Button>
          </div>
        ) : (
          <textarea
            placeholder={"80, 443, 8080"}
            value={form.ports_manual}
            onChange={e => set('ports_manual', e.target.value)}
            rows={3}
            className="w-full bg-secondary/50 border border-border/60 rounded-md font-mono text-sm p-2.5 resize-none focus:outline-none"
          />
        )}
      </div>

      {/* Grid Inputs */}
      <div className="grid grid-cols-3 gap-3">
        {/* Fleet, Rate, Partitions (Same as your original code) */}
        {[
          { label: 'Fleet', key: 'fleet_size' },
          { label: 'Rate', key: 'masscan_rate' },
          { label: 'Partitions', key: 'partitions' }
        ].map((item) => (
          <div key={item.key} className="space-y-1.5">
            <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">{item.label}</Label>
            <Input
              type="number"
              value={form[item.key]}
              onChange={e => set(item.key, e.target.value)}
              className="bg-secondary/50 border-border/60 font-mono text-sm h-10"
            />
          </div>
        ))}
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