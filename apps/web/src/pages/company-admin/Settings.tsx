import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Building2, Shield, Bell, BarChart2, Users, Save, Check } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { queryClient } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

function SectionCard({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Building2;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Icon className="w-4 h-4 text-brand-600" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-600">{label}</span>
      <span className="text-sm font-medium text-gray-900">{value}</span>
    </div>
  );
}

export default function CompanySettings() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['hr', 'stats'],
    queryFn: () => api.get('/hr/stats').then((r) => r.data.data),
  });

  const [orgName, setOrgName] = useState('');
  const [industry, setIndustry] = useState('');
  const [orgSaved, setOrgSaved] = useState(false);

  const updateOrg = useMutation({
    mutationFn: (data: { name: string; industry: string }) => api.patch('/hr/org', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr', 'stats'] });
      setOrgSaved(true);
      toast.success('Organization details updated');
      setTimeout(() => setOrgSaved(false), 2000);
    },
    onError: () => toast.error('Failed to update organization'),
  });

  const handleOrgSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const name = orgName.trim() || stats?.orgName;
    const ind = industry.trim() || stats?.industry || '';
    if (!name) return;
    updateOrg.mutate({ name, industry: ind });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => <div key={i} className="h-40 bg-gray-100 rounded-xl animate-pulse" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-gray-900">Organization Settings</h1>
        <p className="text-gray-500">Manage your organization configuration and preferences</p>
      </motion.div>

      {/* Org Details — editable */}
      <SectionCard icon={Building2} title="Organization">
        <form onSubmit={handleOrgSubmit} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="orgName">Organization Name</Label>
              <Input
                id="orgName"
                className="mt-1"
                placeholder={stats?.orgName ?? 'Enter org name'}
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="industry">Industry</Label>
              <Input
                id="industry"
                className="mt-1"
                placeholder={stats?.industry ?? 'e.g. Construction, Healthcare'}
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center justify-between pt-1">
            <p className="text-xs text-gray-400">
              Plan: <span className="font-medium text-gray-600">{stats?.subscriptionTier ?? 'STARTER'}</span>
              &ensp;·&ensp;Max workers: <span className="font-medium text-gray-600">{stats?.maxWorkers ?? 50}</span>
            </p>
            <Button type="submit" size="sm" loading={updateOrg.isPending} disabled={updateOrg.isPending}>
              {orgSaved ? <><Check className="w-3.5 h-3.5 mr-1" /> Saved</> : <><Save className="w-3.5 h-3.5 mr-1" /> Save changes</>}
            </Button>
          </div>
        </form>
      </SectionCard>

      {/* Org Stats — read-only */}
      <SectionCard icon={Users} title="Workforce Summary">
        <InfoRow label="Total Workers" value={stats?.totalWorkers?.toString() ?? '—'} />
        <InfoRow label="Active (last 30 days)" value={stats?.activeWorkers?.toString() ?? '—'} />
        <InfoRow label="Departments" value={stats?.totalDepartments?.toString() ?? '—'} />
        <InfoRow label="Pending Invites" value={stats?.totalInvites?.toString() ?? '0'} />
      </SectionCard>

      {/* Risk Thresholds — informational */}
      <SectionCard icon={BarChart2} title="Risk Thresholds">
        <p className="text-xs text-gray-500 -mt-1 mb-2">
          These thresholds govern when automatic alerts are triggered. Contact support to adjust them.
        </p>
        <InfoRow label="Org Risk Alert" value="Score ≥ 65 → org-level alert" />
        <InfoRow label="Department Risk Alert" value="Score ≥ 70 → department alert" />
        <InfoRow label="Check-in Compliance Alert" value="< 50% compliance rate" />
        <InfoRow label="Escalation Detection" value="7-day pain delta > 0.5" />
      </SectionCard>

      {/* Security — informational */}
      <SectionCard icon={Shield} title="Security">
        <InfoRow label="Session Timeout" value="7 days (refresh token expiry)" />
        <InfoRow label="Password Policy" value="Minimum 8 characters" />
        <InfoRow label="MFA" value="Available on Enterprise plan" />
        <InfoRow label="SAML SSO" value="Available on Enterprise plan" />
      </SectionCard>

      {/* Notifications — informational */}
      <SectionCard icon={Bell} title="Notifications">
        <InfoRow label="In-app Notifications" value="Enabled" />
        <InfoRow label="Escalation Alerts" value="Real-time (in-app)" />
        <InfoRow label="Email Delivery" value="Configure via SendGrid API key" />
        <InfoRow label="Weekly Digest" value="Coming soon" />
      </SectionCard>

      {/* Data & Privacy */}
      <SectionCard icon={Users} title="Data & Privacy">
        <InfoRow label="Data Residency" value="US (default)" />
        <InfoRow label="Anonymization Threshold" value="Minimum 5 workers per group view" />
        <InfoRow label="Audit Log Retention" value="Indefinite" />
        <InfoRow label="GDPR / HIPAA Compliance" value="Architecture designed for compliance" />
      </SectionCard>
    </div>
  );
}
