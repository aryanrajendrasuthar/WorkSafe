import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { CreditCard, CheckCircle, Zap } from 'lucide-react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const TIERS = [
  {
    name: 'Starter',
    key: 'STARTER',
    price: '$149',
    period: '/month',
    description: 'For small teams getting started with injury prevention.',
    maxWorkers: 50,
    features: ['Up to 50 workers', 'Daily check-ins', 'Exercise programs', 'Basic risk scores', 'Email support'],
    color: 'border-gray-200',
    badgeVariant: 'outline' as const,
  },
  {
    name: 'Growth',
    key: 'GROWTH',
    price: '$399',
    period: '/month',
    description: 'For growing organizations with multiple departments.',
    maxWorkers: 250,
    features: ['Up to 250 workers', 'Everything in Starter', 'Department analytics', 'Therapist dashboard', 'OSHA reports', 'Escalation alerts', 'Priority support'],
    color: 'border-brand-300 ring-2 ring-brand-200',
    badgeVariant: 'success' as const,
    highlighted: true,
  },
  {
    name: 'Enterprise',
    key: 'ENTERPRISE',
    price: 'Custom',
    period: '',
    description: 'For large organizations with complex compliance needs.',
    maxWorkers: Infinity,
    features: ['Unlimited workers', 'Everything in Growth', 'SSO / SAML', 'Multi-tenancy', 'Audit logs', 'Custom integrations', 'Dedicated CSM'],
    color: 'border-gray-200',
    badgeVariant: 'outline' as const,
  },
];

export default function BillingPage() {
  const { data: stats } = useQuery({
    queryKey: ['hr', 'stats'],
    queryFn: () => api.get('/hr/stats').then((r) => r.data.data),
  });

  const currentTier = stats?.subscriptionTier ?? 'STARTER';
  const maxWorkers = stats?.maxWorkers ?? 50;
  const totalUsers = stats?.totalWorkers ?? 0;

  return (
    <div className="space-y-6 max-w-4xl">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-gray-900">Billing & Plans</h1>
        <p className="text-gray-500 text-sm">Manage your subscription</p>
      </motion.div>

      {/* Current plan */}
      <Card className="border-brand-200 bg-brand-50/30">
        <CardContent className="p-5 flex items-center gap-4 flex-wrap">
          <div className="w-11 h-11 bg-brand-100 rounded-xl flex items-center justify-center shrink-0">
            <CreditCard className="w-5 h-5 text-brand-600" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="font-bold text-gray-900">{currentTier} Plan</p>
              <Badge variant="success">Active</Badge>
            </div>
            <p className="text-sm text-gray-500 mt-0.5">
              {totalUsers} / {maxWorkers === Infinity ? '∞' : maxWorkers} workers · Renews monthly
            </p>
            {totalUsers > maxWorkers * 0.8 && (
              <p className="text-xs text-amber-600 mt-1 font-medium">⚠ Approaching worker limit — consider upgrading</p>
            )}
          </div>
          <Button variant="outline" className="shrink-0" onClick={() => toast.info('Stripe billing portal — coming soon')}>
            Manage Subscription
          </Button>
        </CardContent>
      </Card>

      {/* Plans grid */}
      <div className="grid md:grid-cols-3 gap-4">
        {TIERS.map((tier, i) => {
          const isCurrent = currentTier === tier.key;
          return (
            <motion.div key={tier.key} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
              <Card className={`relative h-full ${tier.color}`}>
                {tier.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-brand-600 text-white text-[10px] font-bold px-3 py-1 rounded-full flex items-center gap-1">
                      <Zap className="w-3 h-3" /> Most Popular
                    </span>
                  </div>
                )}
                <CardHeader className="pb-2 pt-6">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{tier.name}</CardTitle>
                    {isCurrent && <Badge variant={tier.badgeVariant}>Current</Badge>}
                  </div>
                  <div className="flex items-baseline gap-1 mt-2">
                    <span className="text-3xl font-bold text-gray-900">{tier.price}</span>
                    <span className="text-gray-500 text-sm">{tier.period}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{tier.description}</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <ul className="space-y-1.5">
                    {tier.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                        <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="w-full"
                    variant={isCurrent ? 'outline' : tier.highlighted ? 'default' : 'outline'}
                    disabled={isCurrent}
                    onClick={() => toast.info('Stripe Checkout — coming soon')}
                  >
                    {isCurrent ? 'Current Plan' : `Upgrade to ${tier.name}`}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
