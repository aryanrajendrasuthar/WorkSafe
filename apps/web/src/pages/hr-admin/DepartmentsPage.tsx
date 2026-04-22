import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Building2, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { queryClient } from '@/lib/queryClient';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

function DeptModal({ dept, onClose }: { dept?: any; onClose: () => void }) {
  const [name, setName] = useState(dept?.name ?? '');
  const [description, setDescription] = useState(dept?.description ?? '');
  const [location, setLocation] = useState(dept?.location ?? '');

  const createMutation = useMutation({
    mutationFn: () => api.post('/hr/departments', { name, description: description || undefined, location: location || undefined }),
    onSuccess: () => { toast.success('Department created'); queryClient.invalidateQueries({ queryKey: ['hr', 'departments'] }); onClose(); },
    onError: () => toast.error('Failed'),
  });

  const updateMutation = useMutation({
    mutationFn: () => api.patch(`/hr/departments/${dept.id}`, { name, description: description || undefined, location: location || undefined }),
    onSuccess: () => { toast.success('Department updated'); queryClient.invalidateQueries({ queryKey: ['hr', 'departments'] }); onClose(); },
    onError: () => toast.error('Failed'),
  });

  const inputCls = 'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300';

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl w-full max-w-sm p-5 space-y-4">
        <h3 className="font-bold text-gray-900">{dept ? 'Edit Department' : 'New Department'}</h3>
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">Name *</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Warehouse" className={inputCls} />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">Description</label>
            <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional description" className={inputCls} />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">Location</label>
            <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Building A" className={inputCls} />
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button className="flex-1" onClick={() => (dept ? updateMutation.mutate() : createMutation.mutate())} loading={createMutation.isPending || updateMutation.isPending}>
            {dept ? 'Save' : 'Create'}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

export default function HRDepartments() {
  const [showModal, setShowModal] = useState(false);
  const [editDept, setEditDept] = useState<any>(null);

  const { data: departments = [], isLoading } = useQuery({
    queryKey: ['hr', 'departments'],
    queryFn: () => api.get('/hr/departments').then((r) => r.data.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/hr/departments/${id}`),
    onSuccess: () => { toast.success('Department deleted'); queryClient.invalidateQueries({ queryKey: ['hr', 'departments'] }); },
    onError: () => toast.error('Failed — department may have workers assigned'),
  });

  return (
    <div className="space-y-5 max-w-2xl">
      <AnimatePresence>
        {(showModal || editDept) && (
          <DeptModal dept={editDept} onClose={() => { setShowModal(false); setEditDept(null); }} />
        )}
      </AnimatePresence>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Departments</h1>
          <p className="text-gray-500 text-sm">{departments.length} departments</p>
        </div>
        <Button className="gap-1.5" onClick={() => setShowModal(true)}>
          <Plus className="w-4 h-4" /> New Department
        </Button>
      </motion.div>

      {isLoading ? (
        <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-16 bg-gray-100 rounded-2xl animate-pulse" />)}</div>
      ) : departments.length === 0 ? (
        <Card><CardContent className="py-16 text-center text-gray-400"><Building2 className="w-10 h-10 mx-auto mb-2 opacity-40" /><p>No departments yet</p></CardContent></Card>
      ) : (
        <div className="space-y-2">
          {departments.map((dept: any, i: number) => (
            <motion.div key={dept.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
              <Card>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                    <Building2 className="w-5 h-5 text-blue-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900">{dept.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {dept._count?.users ?? 0} workers{dept.location ? ` · ${dept.location}` : ''}
                      {dept.description ? ` · ${dept.description}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => setEditDept(dept)} className="text-gray-400 hover:text-gray-600 transition-colors p-1">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => { if (confirm('Delete this department?')) deleteMutation.mutate(dept.id); }} className="text-gray-400 hover:text-red-500 transition-colors p-1">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
