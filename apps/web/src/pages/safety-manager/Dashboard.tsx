import { motion } from 'framer-motion';
import { TrendingDown, AlertTriangle, Users, FileBarChart, ArrowRight, Activity, Building2, Shield } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';

export default function SafetyManagerDashboard() {
  const riskTrendData = Array.from({ length: 12 }, (_, i) => ({
    month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i],
    score: Math.max(20, 75 - i * 3 + (Math.random() - 0.5) * 8),
  })).map(d => ({ ...d, score: parseFloat(d.score.toFixed(1)) }));

  const deptRiskData = [
    { dept: 'Warehouse', score: 68, workers: 45 },
    { dept: 'Assembly', score: 52, workers: 38 },
    { dept: 'Office', score: 28, workers: 62 },
    { dept: 'Logistics', score: 45, workers: 22 },
    { dept: 'QA', score: 31, workers: 18 },
  ];

  const bodyRegionData = [
    { region: 'Lower Back', count: 87, color: '#f97316' },
    { region: 'Shoulders', count: 64, color: '#8b5cf6' },
    { region: 'Wrists', count: 45, color: '#06b6d4' },
    { region: 'Knees', count: 38, color: '#22c55e' },
    { region: 'Neck', count: 31, color: '#f59e0b' },
  ];

  const riskDistribution = [
    { name: 'Low', value: 42, color: '#22c55e' },
    { name: 'Medium', value: 28, color: '#f59e0b' },
    { name: 'High', value: 18, color: '#f97316' },
    { name: 'Critical', value: 8, color: '#ef4444' },
  ];

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Risk Intelligence Dashboard</h1>
            <p className="text-gray-500">Acme Manufacturing Co. · Updated 5 min ago</p>
          </div>
          <Link to="/safety/reports">
            <Button variant="outline">
              <FileBarChart className="w-4 h-4 mr-2" />
              OSHA Reports
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Shield, label: 'Org Risk Score', value: '34', sub: '↓ 8 pts this month', color: 'text-green-600', bg: 'bg-green-50', badge: 'Low' },
          { icon: AlertTriangle, label: 'Active Alerts', value: '3', sub: '1 critical threshold', color: 'text-orange-600', bg: 'bg-orange-50', badge: null },
          { icon: Activity, label: 'Check-in Rate', value: '84%', sub: '↑ 6% this week', color: 'text-blue-600', bg: 'bg-blue-50', badge: null },
          { icon: Users, label: 'Active Workers', value: '185', sub: '21 on programs', color: 'text-purple-600', bg: 'bg-purple-50', badge: null },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-10 h-10 ${stat.bg} rounded-xl flex items-center justify-center`}>
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                  {stat.badge && <Badge variant="risk_low">{stat.badge}</Badge>}
                </div>
                <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                <div className="text-sm text-gray-600 mt-0.5">{stat.label}</div>
                <div className="text-xs text-green-600 mt-0.5">{stat.sub}</div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Main charts */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Risk trend */}
        <motion.div className="lg:col-span-2" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-green-500" />
                  Org-wide Risk Score Trend
                </CardTitle>
                <Badge variant="success">↓ Improving</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={riskTrendData}>
                  <defs>
                    <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0e95e7" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#0e95e7" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#9ca3af' }} />
                  <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                  <Area type="monotone" dataKey="score" stroke="#0e95e7" strokeWidth={2.5} fill="url(#riskGrad)" name="Risk Score" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Risk distribution donut */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Worker Risk Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={riskDistribution} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                    {riskDistribution.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend iconType="circle" iconSize={8} formatter={(value) => <span className="text-xs">{value}</span>} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Department risk */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-blue-500" />
                  Department Risk Scores
                </CardTitle>
                <Link to="/safety/departments">
                  <Button variant="ghost" size="sm" className="text-xs">
                    Details <ArrowRight className="w-3 h-3" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {deptRiskData.sort((a, b) => b.score - a.score).map((dept) => (
                  <div key={dept.dept}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="font-medium text-gray-700">{dept.dept}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">{dept.workers} workers</span>
                        <span className={`font-semibold ${dept.score >= 60 ? 'text-orange-600' : dept.score >= 40 ? 'text-amber-600' : 'text-green-600'}`}>
                          {dept.score}
                        </span>
                      </div>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${dept.score}%`,
                          background: dept.score >= 60 ? '#f97316' : dept.score >= 40 ? '#f59e0b' : '#22c55e',
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Top body regions */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Top Reported Body Regions</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={bodyRegionData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10, fill: '#9ca3af' }} />
                  <YAxis type="category" dataKey="region" tick={{ fontSize: 11, fill: '#6b7280' }} width={80} />
                  <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                  <Bar dataKey="count" name="Reports" radius={[0, 4, 4, 0]}>
                    {bodyRegionData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
