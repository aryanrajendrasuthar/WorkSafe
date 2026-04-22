import { motion } from 'framer-motion';
import { Users, UserCheck, Building2, Mail, ArrowRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { useAuthStore } from '@/store/auth.store';

export default function HRAdminDashboard() {
  const user = useAuthStore((s) => s.user);

  const { data: stats } = useQuery({
    queryKey: ['hr', 'stats'],
    queryFn: () => api.get('/hr/stats').then((r) => r.data.data),
  });

  const statCards = [
    { icon: Users,     label: 'Total Employees',  value: stats?.totalWorkers ?? '—',     color: 'text-blue-600',   bg: 'bg-blue-50' },
    { icon: UserCheck, label: 'Pending Invites',   value: stats?.totalInvites ?? '—',     color: 'text-amber-600',  bg: 'bg-amber-50' },
    { icon: Building2, label: 'Departments',        value: stats?.totalDepartments ?? '—', color: 'text-purple-600', bg: 'bg-purple-50' },
    { icon: Mail,      label: 'Active (30 days)',   value: stats?.activeWorkers ?? '—',    color: 'text-green-600',  bg: 'bg-green-50' },
  ];

  const quickLinks = [
    { label: 'Employee Roster', desc: 'View, deactivate, or reassign team members', href: '/hr/employees', icon: Users },
    { label: 'Departments',     desc: 'Create and manage organizational units',       href: '/hr/departments', icon: Building2 },
    { label: 'Invites',         desc: 'Send new invites and track pending ones',      href: '/hr/invites',     icon: Mail },
  ];

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-gray-900">HR Dashboard</h1>
        <p className="text-gray-500">Welcome back, {user?.firstName}. Manage your workforce.</p>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card>
              <CardContent className="p-5">
                <div className={`w-10 h-10 ${stat.bg} rounded-xl flex items-center justify-center mb-3`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                <div className="text-sm text-gray-600 mt-0.5">{stat.label}</div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        {quickLinks.map((item, i) => (
          <motion.div key={item.href} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Link to={item.href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer group">
                <CardContent className="flex items-center gap-4 p-5">
                  <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <item.icon className="w-5 h-5 text-brand-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 text-sm">{item.label}</div>
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
