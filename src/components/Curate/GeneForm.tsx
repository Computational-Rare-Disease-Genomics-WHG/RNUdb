import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Save, X } from 'lucide-react';

interface GeneFormProps {
  initialData?: {
    id: string;
    name: string;
    fullName: string;
    chromosome: string;
    start: number;
    end: number;
    strand: string;
    sequence: string;
    description: string;
  };
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

const GeneForm: React.FC<GeneFormProps> = ({ initialData, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    id: initialData?.id || '',
    name: initialData?.name || '',
    fullName: initialData?.fullName || '',
    chromosome: initialData?.chromosome || '',
    start: initialData?.start || '',
    end: initialData?.end || '',
    strand: initialData?.strand || '+',
    sequence: initialData?.sequence || '',
    description: initialData?.description || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      start: Number(formData.start),
      end: Number(formData.end),
    });
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Gene ID</label>
          <Input
            value={formData.id}
            onChange={(e) => handleChange('id', e.target.value)}
            placeholder="e.g., RNU4-2"
            required
            disabled={!!initialData}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <Input
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="e.g., RNU4-2"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
        <Input
          value={formData.fullName}
          onChange={(e) => handleChange('fullName', e.target.value)}
          placeholder="e.g., RNA, U4 small nuclear 2"
          required
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Chromosome</label>
          <Input
            value={formData.chromosome}
            onChange={(e) => handleChange('chromosome', e.target.value)}
            placeholder="e.g., chr12"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Start</label>
          <Input
            type="number"
            value={formData.start}
            onChange={(e) => handleChange('start', e.target.value)}
            placeholder="Genomic start position"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">End</label>
          <Input
            type="number"
            value={formData.end}
            onChange={(e) => handleChange('end', e.target.value)}
            placeholder="Genomic end position"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Strand</label>
        <select
          value={formData.strand}
          onChange={(e) => handleChange('strand', e.target.value)}
          className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
        >
          <option value="+">+ (Forward)</option>
          <option value="-">- (Reverse)</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Sequence</label>
        <textarea
          value={formData.sequence}
          onChange={(e) => handleChange('sequence', e.target.value)}
          placeholder="RNA sequence"
          rows={3}
          className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          placeholder="Gene description"
          rows={2}
          className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
          required
        />
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="submit" className="bg-teal-600 hover:bg-teal-700 text-white">
          <Save className="h-4 w-4 mr-2" />
          {initialData ? 'Update Gene' : 'Create Gene'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          <X className="h-4 w-4 mr-2" />
          Cancel
        </Button>
      </div>
    </form>
  );
};

export default GeneForm;
