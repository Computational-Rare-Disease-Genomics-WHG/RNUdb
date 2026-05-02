import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Save, X } from 'lucide-react';

interface VariantFormProps {
  geneId?: string;
  initialData?: any | null;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

const VariantForm = ({ geneId, initialData, onSubmit, onCancel }: VariantFormProps) => {
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
          <Label className="text-sm font-medium text-slate-700 mb-1">Variant ID</Label>
          <Input
            value={formData.id}
            onChange={(e) => setFormData({ ...formData, id: e.target.value })}
            placeholder="e.g., RNU4-2_123_A_G"
            required
            disabled={!!initialData}
          />
        </div>
        <div>
          <Label className="text-sm font-medium text-slate-700 mb-1">Gene ID</Label>
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
          <Label className="text-sm font-medium text-slate-700 mb-1">Genomic Position</Label>
          <Input
            type="number"
            value={formData.position}
            onChange={(e) => setFormData({ ...formData, position: e.target.value })}
            required
          />
        </div>
        <div>
          <Label className="text-sm font-medium text-slate-700 mb-1">Ref</Label>
          <Input
            value={formData.ref}
            onChange={(e) => setFormData({ ...formData, ref: e.target.value })}
            placeholder="Reference allele"
            required
          />
        </div>
        <div>
          <Label className="text-sm font-medium text-slate-700 mb-1">Alt</Label>
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
          <Label className="text-sm font-medium text-slate-700 mb-1">HGVS</Label>
          <Input
            value={formData.hgvs}
            onChange={(e) => setFormData({ ...formData, hgvs: e.target.value })}
            placeholder="e.g., c.123A>G"
          />
        </div>
        <div>
          <Label className="text-sm font-medium text-slate-700 mb-1">Consequence</Label>
          <Input
            value={formData.consequence}
            onChange={(e) => setFormData({ ...formData, consequence: e.target.value })}
            placeholder="e.g., missense"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-sm font-medium text-slate-700 mb-1">Clinical Significance</Label>
          <Select
            value={formData.clinical_significance}
            onValueChange={(value) => setFormData({ ...formData, clinical_significance: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Pathogenic">Pathogenic</SelectItem>
              <SelectItem value="Likely Pathogenic">Likely Pathogenic</SelectItem>
              <SelectItem value="VUS">VUS</SelectItem>
              <SelectItem value="Likely Benign">Likely Benign</SelectItem>
              <SelectItem value="Benign">Benign</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-sm font-medium text-slate-700 mb-1">ClinVar Significance</Label>
          <Input
            value={formData.clinvar_significance}
            onChange={(e) => setFormData({ ...formData, clinvar_significance: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-sm font-medium text-slate-700 mb-1">Function Score</Label>
          <Input
            type="number"
            step="0.001"
            value={formData.function_score}
            onChange={(e) => setFormData({ ...formData, function_score: e.target.value })}
          />
        </div>
        <div>
          <Label className="text-sm font-medium text-slate-700 mb-1">Depletion Group</Label>
          <Select
            value={formData.depletion_group}
            onValueChange={(value) => setFormData({ ...formData, depletion_group: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="strong">Strong</SelectItem>
              <SelectItem value="moderate">Moderate</SelectItem>
              <SelectItem value="normal">Normal</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-sm font-medium text-slate-700 mb-1">gnomAD AC</Label>
          <Input
            type="number"
            value={formData.gnomad_ac}
            onChange={(e) => setFormData({ ...formData, gnomad_ac: e.target.value })}
          />
        </div>
        <div>
          <Label className="text-sm font-medium text-slate-700 mb-1">gnomAD Hom</Label>
          <Input
            type="number"
            value={formData.gnomad_hom}
            onChange={(e) => setFormData({ ...formData, gnomad_hom: e.target.value })}
          />
        </div>
      </div>

      <div>
        <Label className="text-sm font-medium text-slate-700 mb-1">PMID</Label>
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
