import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Save, X } from 'lucide-react';

interface LiteratureFormProps {
  initialData?: any;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

const LiteratureForm: React.FC<LiteratureFormProps> = ({ initialData, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    id: initialData?.id || '',
    title: initialData?.title || '',
    authors: initialData?.authors || '',
    journal: initialData?.journal || '',
    year: initialData?.year || '',
    doi: initialData?.doi || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Literature ID</label>
        <Input
          value={formData.id}
          onChange={(e) => setFormData({ ...formData, id: e.target.value })}
          placeholder="e.g., pmid12345678"
          required
          disabled={!!initialData}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
        <Input
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Paper title"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Authors</label>
        <Input
          value={formData.authors}
          onChange={(e) => setFormData({ ...formData, authors: e.target.value })}
          placeholder="Author list"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Journal</label>
          <Input
            value={formData.journal}
            onChange={(e) => setFormData({ ...formData, journal: e.target.value })}
            placeholder="Journal name"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
          <Input
            value={formData.year}
            onChange={(e) => setFormData({ ...formData, year: e.target.value })}
            placeholder="Publication year"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">DOI</label>
        <Input
          value={formData.doi}
          onChange={(e) => setFormData({ ...formData, doi: e.target.value })}
          placeholder="DOI"
          required
        />
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="submit" className="bg-teal-600 hover:bg-teal-700 text-white">
          <Save className="h-4 w-4 mr-2" />
          {initialData ? 'Update Literature' : 'Create Literature'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          <X className="h-4 w-4 mr-2" />
          Cancel
        </Button>
      </div>
    </form>
  );
};

export default LiteratureForm;
