import { motion } from 'framer-motion';
import { Users, AlertTriangle, Dumbbell, TrendingUp, ArrowRight, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';

export default function TherapistDashboard() {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-gray-900">Good morning, {user?.firstName}!</h1>
        <p className="text-gray-500">Here's your patient overview for today.</p>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Users, label: 'Active Workers', value: '24', sub: 'Under your care', color: 'text-blue-600', bg: 'bg-blue-50' },
          { icon: AlertTriangle, label: 'Escalations', value: '3', sub: '↑ 1 new today', color: 'text-orange-600', bg: 'bg-orange-50' },
          { icon: Dumbbell, label: 'Programs Assigned', value: '18', sub: 'This week: 5', color: 'text-purple-600', bg: 'bg-purple-50' },
          { icon: Activity, label: 'Check-in Rate', value: '87%', sub: 'Last 7 days', color: 'text-green-600', bg: 'bg-green-50' },
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

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-500" />
                Workers Requiring Attention
              </CardTitle>
              <Link to="/therapist/escalations">
                <Button variant="ghost" size="sm" className="text-xs">View all <ArrowRight className="w-3 h-3" /></Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { name: 'Alex Thompson', dept: 'Warehouse', region: 'Lower Back', delta: '+4', severity: 'critical' },
                { name: 'Jordan Lee', dept: 'Assembly', region: 'Left Shoulder', delta: '+3', severity: 'high' },
                { name: 'Maria Santos', dept: 'Warehouse', region: 'Wrists', delta: '+2', severity: 'medium' },
              ].map((worker) => (
                <div key={worker.name} className="flex items-center gap-3 p-3 rounded-xl border hover:bg-gray-50 transition-colors">
                  <div className="w-8 h-8 gradient-brand rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {worker.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm text-gray-900">{worker.name}</div>
                    <div className="text-xs text-gray-500">{worker.dept} · {worker.region}</div>
                  </div>
                  <Badge variant={worker.severity === 'critical' ? 'risk_critical' : worker.severity === 'high' ? 'risk_high' : 'risk_medium'}>
                    {worker.delta} pts
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-500" />
                Recent Activity
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { action: 'Program assigned', detail: 'Lower Back Prevention → Alex Thompson', time: '2 hours ago', color: 'bg-purple-500' },
                { action: 'Pain escalation alert', detail: 'Jordan Lee — Left Shoulder +3 pts', time: '4 hours ago', color: 'bg-orange-500' },
                { action: 'Check-in reviewed', detail: 'Maria Santos completed daily check-in', time: '6 hours ago', color: 'bg-blue-500' },
                { action: 'Incident logged', detail: 'New incident — Assembly Line', time: 'Yesterday', color: 'bg-red-500' },
              ].map((item, i) => (
                <div key={i} className="flex gap-3">
                  <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${item.color}`} />
                  <div>
                    <div className="text-sm font-medium text-gray-900">{item.action}</div>
                    <div className="text-xs text-gray-500">{item.detail}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{item.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
