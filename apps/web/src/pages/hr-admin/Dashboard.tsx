import { motion } from 'framer-motion';
import { Users, UserCheck, Building2, Mail } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useAuthStore } from '@/store/auth.store';

export default function HRAdminDashboard() {
  const user = useAuthStore((s) => s.user);
  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-gray-900">HR Dashboard</h1>
        <p className="text-gray-500">Welcome back, {user?.firstName}. Manage your workforce.</p>
      </motion.div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Users, label: 'Total Employees', value: '185', color: 'text-blue-600', bg: 'bg-blue-50' },
          { icon: UserCheck, label: 'Pending Invites', value: '12', color: 'text-amber-600', bg: 'bg-amber-50' },
          { icon: Building2, label: 'Departments', value: '5', color: 'text-purple-600', bg: 'bg-purple-50' },
          { icon: Mail, label: 'Sent This Month', value: '28', color: 'text-green-600', bg: 'bg-green-50' },
        ].map((stat, i) => (
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
    </div>
  );
}
