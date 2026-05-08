import { Save, X } from "lucide-react";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const VALID_BASES = /^[ATCGatcg]+$/;

interface VariantFormProps {
  geneId?: string;
  initialData?: any | null;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

const VariantForm = ({
  geneId,
  initialData,
  onSubmit,
  onCancel,
}: VariantFormProps) => {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    id: initialData?.id || "",
    geneId: initialData?.geneId || geneId || "",
    position: initialData?.position || "",
    nucleotidePosition: initialData?.nucleotidePosition || "",
    ref: initialData?.ref || "",
    alt: initialData?.alt || "",
    hgvs: initialData?.hgvs || "",
    function_score: initialData?.function_score ?? "",
    pvalues: initialData?.pvalues ?? "",
    qvalues: initialData?.qvalues ?? "",
    cadd_score: initialData?.cadd_score ?? "",
    depletion_group: initialData?.depletion_group || "",
    gnomad_ac: initialData?.gnomad_ac ?? null,
    gnomad_hom: initialData?.gnomad_hom ?? null,
    aou_ac: initialData?.aou_ac ?? null,
    aou_hom: initialData?.aou_hom ?? null,
  });

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (
      formData.id &&
      !/^chr\d+-\d+-[ATCGatcg]+-[ATCGatcg]+$/.test(formData.id)
    ) {
      newErrors.id =
        "Invalid format. Use chrCHR-POS-REF-ALT (e.g., chr12-120291764-C-T)";
    }

    const pos = Number(formData.position);
    if (isNaN(pos) || pos < 1) {
      newErrors.position = "Must be a positive number";
    }

    if (formData.ref && !VALID_BASES.test(formData.ref)) {
      newErrors.ref = "Invalid nucleotides. Use A, T, C, G only";
    }

    if (formData.alt && !VALID_BASES.test(formData.alt)) {
      newErrors.alt = "Invalid nucleotides. Use A, T, C, G only";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }

    const data = {
      ...formData,
      position: Number(formData.position),
      nucleotidePosition: formData.nucleotidePosition
        ? Number(formData.nucleotidePosition)
        : null,
      function_score: formData.function_score
        ? Number(formData.function_score)
        : null,
      pvalues: formData.pvalues ? Number(formData.pvalues) : null,
      qvalues: formData.qvalues ? Number(formData.qvalues) : null,
      cadd_score: formData.cadd_score ? Number(formData.cadd_score) : null,
    };
    onSubmit(data);
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handlePositionBlur = () => {
    if (formData.position && formData.ref && formData.alt && !formData.id) {
      const chrom = "chr12";
      const ref = formData.ref.toUpperCase();
      const alt = formData.alt.toUpperCase();
      const generatedId = `${chrom}-${formData.position}-${ref}-${alt}`;
      if (/^chr\d+-\d+-[ATCG]+-[ATCG]+$/.test(generatedId)) {
        setFormData((prev) => ({ ...prev, id: generatedId }));
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-sm font-medium text-slate-700 mb-1">
            Variant ID
          </Label>
          <Input
            value={formData.id}
            onChange={(e) => handleChange("id", e.target.value)}
            placeholder="e.g., chr12-120291764-C-T"
            disabled={!!initialData}
          />
          {errors.id && (
            <p className="text-xs text-red-500 mt-1">{errors.id}</p>
          )}
          <p className="text-xs text-slate-500 mt-1">
            Auto-generated from position/ref/alt if empty
          </p>
        </div>
        <div>
          <Label className="text-sm font-medium text-slate-700 mb-1">
            Gene ID
          </Label>
          <Input
            value={formData.geneId}
            onChange={(e) => handleChange("geneId", e.target.value)}
            placeholder="e.g., RNU4-2"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label className="text-sm font-medium text-slate-700 mb-1">
            Genomic Position
          </Label>
          <Input
            type="number"
            value={formData.position}
            onChange={(e) => handleChange("position", e.target.value)}
            onBlur={handlePositionBlur}
            required
          />
          {errors.position && (
            <p className="text-xs text-red-500 mt-1">{errors.position}</p>
          )}
        </div>
        <div>
          <Label className="text-sm font-medium text-slate-700 mb-1">Ref</Label>
          <Input
            value={formData.ref}
            onChange={(e) => handleChange("ref", e.target.value.toUpperCase())}
            onBlur={handlePositionBlur}
            placeholder="e.g., C"
            required
            maxLength={10}
          />
          {errors.ref && (
            <p className="text-xs text-red-500 mt-1">{errors.ref}</p>
          )}
        </div>
        <div>
          <Label className="text-sm font-medium text-slate-700 mb-1">Alt</Label>
          <Input
            value={formData.alt}
            onChange={(e) => handleChange("alt", e.target.value.toUpperCase())}
            onBlur={handlePositionBlur}
            placeholder="e.g., T"
            required
            maxLength={10}
          />
          {errors.alt && (
            <p className="text-xs text-red-500 mt-1">{errors.alt}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-sm font-medium text-slate-700 mb-1">
            Nucleotide Position
          </Label>
          <Input
            type="number"
            value={formData.nucleotidePosition}
            onChange={(e) => handleChange("nucleotidePosition", e.target.value)}
            placeholder="e.g., 140"
          />
        </div>
        <div>
          <Label className="text-sm font-medium text-slate-700 mb-1">
            HGVS
          </Label>
          <Input
            value={formData.hgvs}
            onChange={(e) => handleChange("hgvs", e.target.value)}
            placeholder="e.g., n.140C>T"
          />
        </div>
      </div>

      <div className="border-t border-slate-200 pt-4 mt-4">
        <Label className="text-sm font-semibold text-teal-700 mb-3 block">
          SGE Data
        </Label>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-medium text-slate-700 mb-1">
              Function Score
            </Label>
            <Input
              type="number"
              step="0.001"
              value={formData.function_score}
              onChange={(e) => handleChange("function_score", e.target.value)}
              placeholder="e.g., -1.234"
            />
          </div>
          <div>
            <Label className="text-sm font-medium text-slate-700 mb-1">
              Depletion Group
            </Label>
            <select
              value={formData.depletion_group}
              onChange={(e) => handleChange("depletion_group", e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">Select...</option>
              <option value="strong">Strong</option>
              <option value="moderate">Moderate</option>
              <option value="normal">Normal</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mt-4">
        <div>
          <Label className="text-sm font-medium text-slate-700 mb-1">
            P-Value
          </Label>
          <Input
            type="number"
            step="0.001"
            value={formData.pvalues}
            onChange={(e) => handleChange("pvalues", e.target.value)}
            placeholder="e.g., 0.001"
          />
        </div>
        <div>
          <Label className="text-sm font-medium text-slate-700 mb-1">
            Q-Value
          </Label>
          <Input
            type="number"
            step="0.001"
            value={formData.qvalues}
            onChange={(e) => handleChange("qvalues", e.target.value)}
            placeholder="e.g., 0.05"
          />
        </div>
        <div>
          <Label className="text-sm font-medium text-slate-700 mb-1">
            CADD Score
          </Label>
          <Input
            type="number"
            step="0.01"
            value={formData.cadd_score}
            onChange={(e) => handleChange("cadd_score", e.target.value)}
            placeholder="e.g., 15.5"
          />
        </div>
      </div>

      <div className="border-t border-slate-200 pt-4 mt-4">
        <Label className="text-sm font-medium text-slate-500 mb-3 block">
          Population Data (Auto-populated, read-only)
        </Label>
        <div className="grid grid-cols-4 gap-4">
          <div>
            <Label className="text-xs text-slate-500 mb-1">gnomAD AC</Label>
            <Input
              value={formData.gnomad_ac ?? ""}
              disabled
              className="bg-slate-50"
              placeholder="N/A"
            />
          </div>
          <div>
            <Label className="text-xs text-slate-500 mb-1">gnomAD Hom</Label>
            <Input
              value={formData.gnomad_hom ?? ""}
              disabled
              className="bg-slate-50"
              placeholder="N/A"
            />
          </div>
          <div>
            <Label className="text-xs text-slate-500 mb-1">All of Us AC</Label>
            <Input
              value={formData.aou_ac ?? ""}
              disabled
              className="bg-slate-50"
              placeholder="N/A"
            />
          </div>
          <div>
            <Label className="text-xs text-slate-500 mb-1">All of Us Hom</Label>
            <Input
              value={formData.aou_hom ?? ""}
              disabled
              className="bg-slate-50"
              placeholder="N/A"
            />
          </div>
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <Button
          type="submit"
          className="bg-teal-600 hover:bg-teal-700 text-white"
        >
          <Save className="h-4 w-4 mr-2" />
          {initialData ? "Update Variant" : "Create Variant"}
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
