import { motion } from 'framer-motion';
import { Users, Building2, TrendingUp, CreditCard, Settings, ArrowRight, Shield, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';

export default function CompanyAdminDashboard() {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-gray-900">Company Overview</h1>
        <p className="text-gray-500">Welcome back, {user?.firstName}. Here's your organization summary.</p>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Users, label: 'Total Workers', value: '185', sub: '12 invited', color: 'text-blue-600', bg: 'bg-blue-50' },
          { icon: Building2, label: 'Departments', value: '5', sub: '23 locations', color: 'text-purple-600', bg: 'bg-purple-50' },
          { icon: Shield, label: 'Org Risk Score', value: '34', sub: 'Low risk', color: 'text-green-600', bg: 'bg-green-50' },
          { icon: Activity, label: 'Avg Check-in Rate', value: '84%', sub: 'Last 30 days', color: 'text-brand-600', bg: 'bg-brand-50' },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card>
              <CardContent className="p-5">
                <div className={`w-10 h-10 ${stat.bg} rounded-xl flex items-center justify-center mb-3`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                <div className="text-sm text-gray-600 mt-0.5">{stat.label}</div>
                <div className="text-xs text-gray-400 mt-0.5">{stat.sub}</div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {[
          { title: 'Manage Users', desc: 'Invite, manage roles, and deactivate team members', href: '/admin/users', icon: Users, color: 'bg-blue-50 text-blue-600' },
          { title: 'Departments', desc: 'Set up your organizational structure', href: '/admin/departments', icon: Building2, color: 'bg-purple-50 text-purple-600' },
          { title: 'Risk Overview', desc: 'View full org risk intelligence and trends', href: '/safety/dashboard', icon: TrendingUp, color: 'bg-green-50 text-green-600' },
          { title: 'Billing & Plans', desc: 'Manage subscription and payment methods', href: '/admin/billing', icon: CreditCard, color: 'bg-amber-50 text-amber-600' },
          { title: 'Audit Log', desc: 'View all access and modification logs', href: '/admin/audit', icon: Shield, color: 'bg-gray-50 text-gray-600' },
          { title: 'Settings', desc: 'Configure SSO, notifications, and integrations', href: '/admin/settings', icon: Settings, color: 'bg-brand-50 text-brand-600' },
        ].map((item, i) => (
          <motion.div key={item.title} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Link to={item.href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer group">
                <CardContent className="flex items-center gap-4 p-5">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${item.color} group-hover:scale-105 transition-transform`}>
                    <item.icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900">{item.title}</div>
                    <div className="text-xs text-gray-500 mt-0.5 truncate">{item.desc}</div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors shrink-0" />
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
