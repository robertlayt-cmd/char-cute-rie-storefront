import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, ArrowLeft, Tag, Percent, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';

export default function AdminDiscounts() {
  const queryClient = useQueryClient();
  const [editingCode, setEditingCode] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: codes = [] } = useQuery({
    queryKey: ['admin-discounts'],
    queryFn: () => base44.entities.DiscountCode.list('-created_date'),
  });

  const createCode = useMutation({
    mutationFn: (data) => base44.entities.DiscountCode.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-discounts']);
      setIsDialogOpen(false);
    }
  });

  const updateCode = useMutation({
    mutationFn: ({ id, data }) => base44.entities.DiscountCode.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-discounts']);
      setIsDialogOpen(false);
    }
  });

  const deleteCode = useMutation({
    mutationFn: (id) => base44.entities.DiscountCode.delete(id),
    onSuccess: () => queryClient.invalidateQueries(['admin-discounts'])
  });

  const openEditDialog = (code = null) => {
    if (code) {
      setEditingCode(code);
    } else {
      setEditingCode({
        code: '',
        discount_type: 'percentage',
        discount_value: 10,
        minimum_order: 0,
        max_uses: -1,
        times_used: 0,
        valid_from: format(new Date(), 'yyyy-MM-dd'),
        valid_until: '',
        is_active: true
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (editingCode.id) {
      await updateCode.mutateAsync({ id: editingCode.id, data: editingCode });
    } else {
      await createCode.mutateAsync(editingCode);
    }
  };

  return (
    <AdminLayout currentPage="AdminDiscounts">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Discount Codes</h1>
            <p className="text-zinc-400">{codes.length} codes</p>
          </div>
          <Button onClick={() => openEditDialog()} className="bg-pink-500 hover:bg-pink-600">
            <Plus className="w-4 h-4 mr-2" />
            Add Code
          </Button>
        </div>

        {/* Codes List */}
        <div className="space-y-3">
          {codes.map((code, i) => (
            <motion.div
              key={code.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="bg-zinc-900 border-zinc-800">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-pink-500/20 flex items-center justify-center">
                    {code.discount_type === 'percentage' ? (
                      <Percent className="w-6 h-6 text-pink-400" />
                    ) : (
                      <DollarSign className="w-6 h-6 text-pink-400" />
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-mono font-bold text-lg">{code.code}</span>
                      {!code.is_active && (
                        <Badge className="bg-zinc-700 text-zinc-400">Inactive</Badge>
                      )}
                    </div>
                    <p className="text-zinc-400 text-sm">
                      {code.discount_type === 'percentage' 
                        ? `${code.discount_value}% off`
                        : `$${code.discount_value} off`
                      }
                      {code.minimum_order > 0 && ` • Min order $${code.minimum_order}`}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-white">
                      {code.times_used} / {code.max_uses === -1 ? '∞' : code.max_uses} uses
                    </p>
                    {code.valid_until && (
                      <p className="text-zinc-400 text-sm">
                        Expires {format(new Date(code.valid_until), 'MMM d, yyyy')}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="border-zinc-700"
                      onClick={() => openEditDialog(code)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="border-zinc-700 text-red-400"
                      onClick={() => {
                        if (confirm('Delete this code?')) {
                          deleteCode.mutate(code.id);
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="bg-zinc-900 border-zinc-800">
            <DialogHeader>
              <DialogTitle className="text-white">
                {editingCode?.id ? 'Edit Discount Code' : 'New Discount Code'}
              </DialogTitle>
            </DialogHeader>

            {editingCode && (
              <div className="space-y-4">
                <div>
                  <Label className="text-zinc-200">Code</Label>
                  <Input
                    value={editingCode.code}
                    onChange={(e) => setEditingCode({ ...editingCode, code: e.target.value.toUpperCase() })}
                    placeholder="e.g. SAVE20"
                    className="bg-zinc-800 border-zinc-600 text-white placeholder:text-zinc-400 font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-zinc-200">Type</Label>
                    <Select 
                      value={editingCode.discount_type} 
                      onValueChange={(v) => setEditingCode({ ...editingCode, discount_type: v })}
                    >
                      <SelectTrigger className="bg-zinc-800 border-zinc-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-800 border-zinc-600">
                        <SelectItem value="percentage">Percentage</SelectItem>
                        <SelectItem value="fixed">Fixed Amount</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-zinc-200">Value</Label>
                    <Input
                      type="number"
                      value={editingCode.discount_value}
                      onChange={(e) => setEditingCode({ ...editingCode, discount_value: parseFloat(e.target.value) || 0 })}
                      className="bg-zinc-800 border-zinc-600 text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-zinc-200">Minimum Order ($)</Label>
                    <Input
                      type="number"
                      value={editingCode.minimum_order}
                      onChange={(e) => setEditingCode({ ...editingCode, minimum_order: parseFloat(e.target.value) || 0 })}
                      className="bg-zinc-800 border-zinc-600 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-zinc-200">Max Uses (-1 = unlimited)</Label>
                    <Input
                      type="number"
                      value={editingCode.max_uses}
                      onChange={(e) => setEditingCode({ ...editingCode, max_uses: parseInt(e.target.value) || -1 })}
                      className="bg-zinc-800 border-zinc-600 text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-zinc-200">Valid From</Label>
                    <Input
                      type="date"
                      value={editingCode.valid_from}
                      onChange={(e) => setEditingCode({ ...editingCode, valid_from: e.target.value })}
                      className="bg-zinc-800 border-zinc-600 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-zinc-200">Valid Until (optional)</Label>
                    <Input
                      type="date"
                      value={editingCode.valid_until}
                      onChange={(e) => setEditingCode({ ...editingCode, valid_until: e.target.value })}
                      className="bg-zinc-800 border-zinc-600 text-white"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    checked={editingCode.is_active}
                    onCheckedChange={(v) => setEditingCode({ ...editingCode, is_active: v })}
                  />
                  <Label>Active</Label>
                </div>

                <div className="flex gap-3 justify-end pt-4">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="border-zinc-700">
                    Cancel
                  </Button>
                  <Button onClick={handleSave} className="bg-pink-500 hover:bg-pink-600">
                    Save
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}