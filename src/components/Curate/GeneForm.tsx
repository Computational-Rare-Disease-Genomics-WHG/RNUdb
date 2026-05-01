import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  } | null | undefined;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

const GeneForm = (props: GeneFormProps) => {
  const { initialData, onSubmit, onCancel } = props;

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
          <label className="block text-sm font-medium text-muted-foreground mb-1">Gene ID</label>
          <Input
            value={formData.id}
            onChange={(e) => handleChange('id', e.target.value)}
            placeholder="e.g., RNU4-2"
            required
            disabled={!!initialData}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1">Name</label>
          <Input
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="e.g., RNU4-2"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-muted-foreground mb-1">Full Name</label>
        <Input
          value={formData.fullName}
          onChange={(e) => handleChange('fullName', e.target.value)}
          placeholder="e.g., RNA, U4 small nuclear 2"
          required
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1">Chromosome</label>
          <Input
            value={formData.chromosome}
            onChange={(e) => handleChange('chromosome', e.target.value)}
            placeholder="e.g., chr12"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1">Start</label>
          <Input
            type="number"
            value={formData.start}
            onChange={(e) => handleChange('start', e.target.value)}
            placeholder="Genomic start position"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1">End</label>
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
        <label className="block text-sm font-medium text-muted-foreground mb-1">Strand</label>
        <Select
          value={formData.strand}
          onValueChange={(value) => handleChange('strand', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select strand" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="+">+ (Forward)</SelectItem>
            <SelectItem value="-">- (Reverse)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="block text-sm font-medium text-muted-foreground mb-1">Sequence</label>
        <Textarea
          value={formData.sequence}
          onChange={(e) => handleChange('sequence', e.target.value)}
          placeholder="RNA sequence"
          rows={3}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-muted-foreground mb-1">Description</label>
        <Textarea
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          placeholder="Gene description"
          rows={2}
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
