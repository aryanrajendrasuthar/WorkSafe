import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  ShieldCheck, TrendingDown, Activity, Users, BarChart3,
  CheckCircle2, ArrowRight, ChevronRight, Star, Zap, Globe, Lock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: 'easeOut' },
};

const stagger = {
  animate: { transition: { staggerChildren: 0.1 } },
};

export default function Landing() {
  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* ─── Nav ──────────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 glass border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 gradient-brand rounded-lg flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">WorkSafe</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Features</a>
              <a href="#how-it-works" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">How it works</a>
              <a href="#pricing" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Pricing</a>
              <a href="#" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Enterprise</a>
            </div>
            <div className="flex items-center gap-3">
              <Link to="/login">
                <Button variant="ghost" size="sm">Sign in</Button>
              </Link>
              <Link to="/register">
                <Button variant="brand" size="sm">
                  Get started free
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ─── Hero ─────────────────────────────────────────────────────────── */}
      <section className="gradient-hero pt-20 pb-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center max-w-4xl mx-auto"
            initial="initial"
            animate="animate"
            variants={stagger}
          >
            <motion.div variants={fadeUp} className="mb-6">
              <Badge className="px-4 py-1.5 text-sm bg-brand-50 text-brand-700 border-brand-200">
                <Zap className="w-3.5 h-3.5 mr-1.5" />
                The #1 MSK Injury Prevention Platform
              </Badge>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-gray-900 tracking-tight leading-tight mb-6"
            >
              Stop injuries{' '}
              <span className="text-transparent bg-clip-text gradient-brand">before</span>
              {' '}they happen
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="text-xl text-gray-600 leading-relaxed mb-10 max-w-2xl mx-auto"
            >
              WorkSafe combines daily worker health check-ins, clinically validated
              exercise programs, and a real-time risk intelligence engine to prevent
              musculoskeletal injuries — saving your organization millions.
            </motion.p>

            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/register">
                <Button variant="brand" size="xl" className="w-full sm:w-auto shadow-xl">
                  Start free trial
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <Button variant="outline" size="xl" className="w-full sm:w-auto">
                Watch demo
                <ChevronRight className="w-5 h-5" />
              </Button>
            </motion.div>

            <motion.p variants={fadeUp} className="mt-6 text-sm text-gray-500">
              No credit card required · 14-day free trial · HIPAA compliant
            </motion.p>
          </motion.div>

          {/* Dashboard Preview */}
          <motion.div
            className="mt-16 relative"
            initial={{ opacity: 0, y: 48 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
          >
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-200/80 overflow-hidden mx-auto max-w-5xl">
              <div className="bg-gray-50 border-b px-4 py-3 flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
                <span className="ml-2 text-xs text-gray-500">WorkSafe — Risk Intelligence Dashboard</span>
              </div>
              <DashboardPreview />
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── Stats ────────────────────────────────────────────────────────── */}
      <section className="py-16 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { value: '30-40%', label: 'of all worker\'s comp costs are MSK injuries' },
              { value: '70%', label: 'of MSK injuries are preventable with early intervention' },
              { value: '$50K', label: 'average cost per MSK injury claim' },
              { value: '20%+', label: 'injury reduction after 12 months on WorkSafe' },
            ].map((stat) => (
              <div key={stat.value} className="text-center">
                <div className="text-4xl font-bold text-white mb-2">{stat.value}</div>
                <div className="text-sm text-gray-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Features ─────────────────────────────────────────────────────── */}
      <section id="features" className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <Badge className="mb-4 bg-brand-50 text-brand-700 border-brand-200">Features</Badge>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Everything you need to protect your workforce
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              One unified platform for workers, therapists, safety managers, and HR —
              all connected in real time.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                className="p-6 rounded-2xl border bg-white hover:shadow-lg transition-shadow duration-300"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
              >
                <div className={`w-12 h-12 rounded-xl ${feature.iconBg} flex items-center justify-center mb-4`}>
                  <feature.icon className={`w-6 h-6 ${feature.iconColor}`} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How it works ─────────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-24 bg-gray-50 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Badge className="mb-4 bg-brand-50 text-brand-700 border-brand-200">How it works</Badge>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              From check-in to risk intelligence in minutes
            </h2>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <motion.div
                key={step.title}
                className="text-center"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
              >
                <div className="w-16 h-16 gradient-brand rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <span className="text-2xl font-bold text-white">{i + 1}</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{step.title}</h3>
                <p className="text-gray-600 leading-relaxed">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Pricing ──────────────────────────────────────────────────────── */}
      <section id="pricing" className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Badge className="mb-4 bg-brand-50 text-brand-700 border-brand-200">Pricing</Badge>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-lg text-gray-600">14-day free trial on all plans. No credit card required.</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {pricingPlans.map((plan, i) => (
              <motion.div
                key={plan.name}
                className={`rounded-2xl border p-8 ${plan.popular ? 'border-brand-500 shadow-xl relative' : 'border-gray-200'}`}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="gradient-brand text-white border-0 shadow">Most Popular</Badge>
                  </div>
                )}
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-1">{plan.name}</h3>
                  <p className="text-sm text-gray-500">{plan.description}</p>
                </div>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                  {plan.period && <span className="text-gray-500 ml-1">{plan.period}</span>}
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feat) => (
                    <li key={feat} className="flex items-center gap-2 text-sm text-gray-700">
                      <CheckCircle2 className="w-4 h-4 text-brand-500 shrink-0" />
                      {feat}
                    </li>
                  ))}
                </ul>
                <Link to="/register">
                  <Button
                    variant={plan.popular ? 'brand' : 'outline'}
                    className="w-full"
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Trust Signals ────────────────────────────────────────────────── */}
      <section className="py-16 bg-gray-50 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-sm text-gray-500 mb-8 font-medium uppercase tracking-wider">
            Enterprise-grade security & compliance
          </p>
          <div className="flex flex-wrap justify-center items-center gap-8">
            {trustBadges.map((badge) => (
              <div key={badge.label} className="flex items-center gap-2 text-gray-700">
                <badge.icon className="w-5 h-5 text-brand-600" />
                <span className="font-semibold text-sm">{badge.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ──────────────────────────────────────────────────────────── */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Ready to protect your workforce?
            </h2>
            <p className="text-xl text-gray-600 mb-10">
              Join hundreds of companies already using WorkSafe to reduce injuries
              and lower their workers' compensation costs.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link to="/register">
                <Button variant="brand" size="xl" className="shadow-xl">
                  Start your free trial
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <Button variant="outline" size="xl">
                Talk to sales
              </Button>
            </div>
            <div className="flex items-center justify-center gap-6 mt-8">
              {['4.9/5 rating', '500+ companies', 'HIPAA compliant'].map((item) => (
                <div key={item} className="flex items-center gap-1.5 text-sm text-gray-500">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  {item}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── Footer ───────────────────────────────────────────────────────── */}
      <footer className="bg-gray-900 text-gray-400 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 gradient-brand rounded-lg flex items-center justify-center">
                <ShieldCheck className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-white">WorkSafe</span>
              <span className="text-sm">© 2026</span>
            </div>
            <div className="flex gap-6 text-sm">
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Terms</a>
              <a href="#" className="hover:text-white transition-colors">Security</a>
              <a href="#" className="hover:text-white transition-colors">HIPAA</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ─── Dashboard Preview ───────────────────────────────────────────────────────
function DashboardPreview() {
  return (
    <div className="p-6 bg-gray-50 min-h-[380px]">
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Org Risk Score', value: '34', sub: 'Low', color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Active Escalations', value: '3', sub: '↑ 1 today', color: 'text-orange-600', bg: 'bg-orange-50' },
          { label: 'Check-in Rate', value: '84%', sub: '↑ 6% this week', color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Active Workers', value: '247', sub: '12 on programs', color: 'text-purple-600', bg: 'bg-purple-50' },
        ].map((card) => (
          <div key={card.label} className="bg-white rounded-xl p-4 border">
            <div className="text-xs text-gray-500 mb-1">{card.label}</div>
            <div className={`text-2xl font-bold ${card.color}`}>{card.value}</div>
            <div className={`text-xs mt-1 px-2 py-0.5 rounded-full inline-block ${card.bg} ${card.color}`}>{card.sub}</div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 bg-white rounded-xl border p-4">
          <div className="text-xs font-medium text-gray-500 mb-3">Org Risk Trend (90 days)</div>
          <MiniChart />
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="text-xs font-medium text-gray-500 mb-3">Top Risk Regions</div>
          {[
            { region: 'Lower Back', value: 68, color: 'bg-orange-400' },
            { region: 'Shoulders', value: 45, color: 'bg-amber-400' },
            { region: 'Wrists', value: 32, color: 'bg-yellow-400' },
            { region: 'Knees', value: 21, color: 'bg-green-400' },
          ].map((r) => (
            <div key={r.region} className="mb-2">
              <div className="flex justify-between text-xs text-gray-600 mb-0.5">
                <span>{r.region}</span><span>{r.value}%</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full">
                <div className={`h-full rounded-full ${r.color}`} style={{ width: `${r.value}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MiniChart() {
  const points = [65, 68, 62, 70, 58, 55, 52, 48, 44, 40, 38, 34];
  const max = Math.max(...points);
  const min = Math.min(...points);
  const h = 80;
  const w = 300;
  const padX = 8;
  const padY = 8;

  const coords = points.map((v, i) => {
    const x = padX + (i / (points.length - 1)) * (w - padX * 2);
    const y = padY + ((max - v) / (max - min)) * (h - padY * 2);
    return `${x},${y}`;
  });

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-20">
      <defs>
        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0e95e7" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#0e95e7" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline
        points={coords.join(' ')}
        fill="none"
        stroke="#0e95e7"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <polygon
        points={`${padX},${h} ${coords.join(' ')} ${w - padX},${h}`}
        fill="url(#chartGrad)"
      />
    </svg>
  );
}

// ─── Data ────────────────────────────────────────────────────────────────────
const features = [
  { title: 'Daily Health Check-ins', description: '60-second interactive body map check-ins that capture pain intensity, severity, and task correlation for every worker.', icon: Activity, iconBg: 'bg-blue-50', iconColor: 'text-blue-600' },
  { title: 'Risk Intelligence Engine', description: 'Real-time org-wide risk scores updated after every check-in. Predictive alerts before injuries occur — not after.', icon: BarChart3, iconBg: 'bg-purple-50', iconColor: 'text-purple-600' },
  { title: 'Exercise Programs', description: 'Clinically validated exercise programs assigned by occupational therapists, tailored to job type and body region.', icon: ShieldCheck, iconBg: 'bg-green-50', iconColor: 'text-green-600' },
  { title: 'Incident & RTW Management', description: 'Structured Return-to-Work protocols with milestone sign-offs and automatic OSHA 300/300A/301 report generation.', icon: CheckCircle2, iconBg: 'bg-orange-50', iconColor: 'text-orange-600' },
  { title: 'Multi-tenant Enterprise', description: 'Full data isolation per company, department heatmaps, HR integrations, SSO, MFA, and audit logging.', icon: Users, iconBg: 'bg-indigo-50', iconColor: 'text-indigo-600' },
  { title: 'Trend Analytics', description: 'Weekly, monthly, quarterly, and annual views. Cohort analysis, program effectiveness reports, and predictive risk scoring.', icon: TrendingDown, iconBg: 'bg-teal-50', iconColor: 'text-teal-600' },
];

const steps = [
  { title: 'Workers check in daily', description: 'Every morning, workers complete a 60-second body map check-in on mobile or web, reporting pain levels and task correlations.' },
  { title: 'Therapists respond instantly', description: 'When pain trends escalate, therapists get alerted within minutes. They assign targeted exercise programs and track recovery in real time.' },
  { title: 'Managers see org-wide risk', description: 'Safety managers get a real-time view of organizational risk with department heatmaps, early warnings, and OSHA-ready reports.' },
];

const pricingPlans = [
  {
    name: 'Starter',
    description: 'For small teams getting started',
    price: '$299',
    period: '/mo',
    popular: false,
    cta: 'Start free trial',
    features: ['Up to 50 workers', 'Basic check-in & programs', 'Safety manager dashboard', 'Email support', 'OSHA report generation'],
  },
  {
    name: 'Growth',
    description: 'For growing organizations',
    price: '$999',
    period: '/mo',
    popular: true,
    cta: 'Start free trial',
    features: ['Up to 500 workers', 'Full risk intelligence engine', 'Multi-department support', 'HR integrations', 'Audit logging & MFA', 'Priority support'],
  },
  {
    name: 'Enterprise',
    description: 'For large organizations',
    price: 'Custom',
    period: '',
    popular: false,
    cta: 'Contact sales',
    features: ['Unlimited workers', 'Predictive ML risk scoring', 'SAML SSO', 'SLA & dedicated CSM', 'SOC 2 Type II', 'Custom integrations'],
  },
];

const trustBadges = [
  { icon: Lock, label: 'HIPAA Compliant' },
  { icon: ShieldCheck, label: 'SOC 2 Type II' },
  { icon: Globe, label: 'GDPR Ready' },
  { icon: CheckCircle2, label: 'AES-256 Encryption' },
  { icon: Star, label: '99.9% Uptime SLA' },
];
