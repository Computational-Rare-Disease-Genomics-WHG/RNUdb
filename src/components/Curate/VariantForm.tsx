import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Save, X } from 'lucide-react';

interface VariantFormProps {
  geneId?: string;
  initialData?: any;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

const VariantForm: React.FC<VariantFormProps> = ({ geneId, initialData, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    id: initialData?.id || '',
    geneId: initialData?.geneId || geneId || '',
    position: initialData?.position || '',
    nucleotidePosition: initialData?.nucleotidePosition || '',
    ref: initialData?.ref || '',
    alt: initialData?.alt || '',
    hgvs: initialData?.hgvs || '',
    consequence: initialData?.consequence || '',
    clinvar_significance: initialData?.clinvar_significance || '',
    clinical_significance: initialData?.clinical_significance || '',
    pmid: initialData?.pmid || '',
    function_score: initialData?.function_score || '',
    depletion_group: initialData?.depletion_group || '',
    gnomad_ac: initialData?.gnomad_ac || '',
    gnomad_hom: initialData?.gnomad_hom || '',
    cohort: initialData?.cohort || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      ...formData,
      position: Number(formData.position),
      nucleotidePosition: formData.nucleotidePosition ? Number(formData.nucleotidePosition) : null,
      function_score: formData.function_score ? Number(formData.function_score) : null,
      gnomad_ac: formData.gnomad_ac ? Number(formData.gnomad_ac) : null,
      gnomad_hom: formData.gnomad_hom ? Number(formData.gnomad_hom) : null,
    };
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Variant ID</label>
          <Input
            value={formData.id}
            onChange={(e) => setFormData({ ...formData, id: e.target.value })}
            placeholder="e.g., RNU4-2_123_A_G"
            required
            disabled={!!initialData}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Gene ID</label>
          <Input
            value={formData.geneId}
            onChange={(e) => setFormData({ ...formData, geneId: e.target.value })}
            placeholder="e.g., RNU4-2"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Genomic Position</label>
          <Input
            type="number"
            value={formData.position}
            onChange={(e) => setFormData({ ...formData, position: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Ref</label>
          <Input
            value={formData.ref}
            onChange={(e) => setFormData({ ...formData, ref: e.target.value })}
            placeholder="Reference allele"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Alt</label>
          <Input
            value={formData.alt}
            onChange={(e) => setFormData({ ...formData, alt: e.target.value })}
            placeholder="Alternate allele"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">HGVS</label>
          <Input
            value={formData.hgvs}
            onChange={(e) => setFormData({ ...formData, hgvs: e.target.value })}
            placeholder="e.g., c.123A>G"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Consequence</label>
          <Input
            value={formData.consequence}
            onChange={(e) => setFormData({ ...formData, consequence: e.target.value })}
            placeholder="e.g., missense"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Clinical Significance</label>
          <select
            value={formData.clinical_significance}
            onChange={(e) => setFormData({ ...formData, clinical_significance: e.target.value })}
            className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
          >
            <option value="">Select...</option>
            <option value="Pathogenic">Pathogenic</option>
            <option value="Likely Pathogenic">Likely Pathogenic</option>
            <option value="VUS">VUS</option>
            <option value="Likely Benign">Likely Benign</option>
            <option value="Benign">Benign</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">ClinVar Significance</label>
          <Input
            value={formData.clinvar_significance}
            onChange={(e) => setFormData({ ...formData, clinvar_significance: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Function Score</label>
          <Input
            type="number"
            step="0.001"
            value={formData.function_score}
            onChange={(e) => setFormData({ ...formData, function_score: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Depletion Group</label>
          <select
            value={formData.depletion_group}
            onChange={(e) => setFormData({ ...formData, depletion_group: e.target.value })}
            className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
          >
            <option value="">Select...</option>
            <option value="strong">Strong</option>
            <option value="moderate">Moderate</option>
            <option value="normal">Normal</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">gnomAD AC</label>
          <Input
            type="number"
            value={formData.gnomad_ac}
            onChange={(e) => setFormData({ ...formData, gnomad_ac: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">gnomAD Hom</label>
          <Input
            type="number"
            value={formData.gnomad_hom}
            onChange={(e) => setFormData({ ...formData, gnomad_hom: e.target.value })}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">PMID</label>
        <Input
          value={formData.pmid}
          onChange={(e) => setFormData({ ...formData, pmid: e.target.value })}
          placeholder="PubMed ID"
        />
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="submit" className="bg-teal-600 hover:bg-teal-700 text-white">
          <Save className="h-4 w-4 mr-2" />
          {initialData ? 'Update Variant' : 'Create Variant'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          <X className="h-4 w-4 mr-2" />
          Cancel
        </Button>
      </div>
    </form>
  );
};

export default VariantForm;
