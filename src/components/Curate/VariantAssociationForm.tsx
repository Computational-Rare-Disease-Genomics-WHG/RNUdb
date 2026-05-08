import { Save, X } from "lucide-react";
import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface VariantAssociationFormProps {
  initialData?: any | null;
  variants: any[];
  literature?: any[];
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

const CLINICAL_SIGNIFICANCE_OPTIONS = [
  { value: "Pathogenic", label: "Pathogenic" },
  { value: "Likely Pathogenic", label: "Likely Pathogenic" },
  { value: "VUS", label: "Variant of Uncertain Significance (VUS)" },
  { value: "Likely Benign", label: "Likely Benign" },
  { value: "Benign", label: "Benign" },
];

const ZYGOSITY_OPTIONS = [
  { value: "Heterozygous", label: "Heterozygous" },
  { value: "Homozygous", label: "Homozygous" },
  { value: "Compound Heterozygous", label: "Compound Heterozygous" },
];

const INHERITANCE_OPTIONS = [
  { value: "Dominant", label: "Dominant" },
  { value: "Biallelic", label: "Biallelic" },
];

const VariantAssociationForm = ({
  initialData,
  variants,
  literature = [],
  onSubmit,
  onCancel,
}: VariantAssociationFormProps) => {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [variantSearch, setVariantSearch] = useState("");
  const [literatureSearch, setLiteratureSearch] = useState("");
  const [linkedVariantSearch, setLinkedVariantSearch] = useState("");
  const [showVariantDropdown, setShowVariantDropdown] = useState(false);
  const [showLiteratureDropdown, setShowLiteratureDropdown] = useState(false);
  const [showLinkedVariantDropdown, setShowLinkedVariantDropdown] =
    useState(false);

  const [formData, setFormData] = useState({
    variant_id: initialData?.variant_id || "",
    literature_id: initialData?.literature_id || "",
    clinical_significance: initialData?.clinical_significance || "",
    zygosity: initialData?.zygosity || "",
    inheritance: initialData?.inheritance || "",
    disease: initialData?.disease || "",
    counts: initialData?.counts ?? "",
    linked_variant_ids: initialData?.linked_variant_ids || "",
  });

  const filteredVariants = useMemo(() => {
    if (!variantSearch) return variants;
    const search = variantSearch.toLowerCase();
    return variants.filter(
      (v) =>
        v.id.toLowerCase().includes(search) ||
        (v.hgvs && v.hgvs.toLowerCase().includes(search)),
    );
  }, [variants, variantSearch]);

  const filteredLiterature = useMemo(() => {
    if (!literatureSearch) return literature;
    const search = literatureSearch.toLowerCase();
    return literature.filter(
      (l) =>
        l.id.toLowerCase().includes(search) ||
        (l.title && l.title.toLowerCase().includes(search)) ||
        (l.doi && l.doi.toLowerCase().includes(search)),
    );
  }, [literature, literatureSearch]);

  const availableLinkedVariants = useMemo(() => {
    if (!linkedVariantSearch) return variants;
    const search = linkedVariantSearch.toLowerCase();
    return variants.filter(
      (v) =>
        v.id.toLowerCase().includes(search) && v.id !== formData.variant_id,
    );
  }, [variants, linkedVariantSearch, formData.variant_id]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.variant_id.trim()) {
      newErrors.variant_id = "Variant is required";
    } else {
      const variantExists = variants.some((v) => v.id === formData.variant_id);
      if (!variantExists) {
        newErrors.variant_id = "Variant does not exist";
      }
    }

    if (!formData.literature_id.trim()) {
      newErrors.literature_id = "Literature is required";
    } else {
      const literatureExists = literature.some(
        (l) => l.id === formData.literature_id,
      );
      if (!literatureExists) {
        newErrors.literature_id = "Literature does not exist";
      }
    }

    if (formData.counts !== "") {
      const countNum = Number(formData.counts);
      if (isNaN(countNum)) {
        newErrors.counts = "Counts must be a number";
      } else if (countNum < 0) {
        newErrors.counts = "Counts must be greater than or equal to 0";
      }
    }

    if (formData.linked_variant_ids) {
      const linkedIds = formData.linked_variant_ids
        .split(",")
        .map((id: string) => id.trim())
        .filter((id: string) => id);
      for (const linkedId of linkedIds) {
        const exists = variants.some((v) => v.id === linkedId);
        if (!exists) {
          newErrors.linked_variant_ids = `Variant ${linkedId} does not exist`;
          break;
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      const submitData = {
        ...formData,
        counts: formData.counts ? Number(formData.counts) : null,
      };
      onSubmit(submitData);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const selectVariant = (variantId: string) => {
    handleChange("variant_id", variantId);
    setVariantSearch("");
    setShowVariantDropdown(false);
  };

  const selectLiterature = (litId: string) => {
    handleChange("literature_id", litId);
    setLiteratureSearch("");
    setShowLiteratureDropdown(false);
  };

  const toggleLinkedVariant = (variantId: string) => {
    const current = formData.linked_variant_ids
      .split(",")
      .map((id: string) => id.trim())
      .filter((id: string) => id);

    if (current.includes(variantId)) {
      handleChange(
        "linked_variant_ids",
        current.filter((id: string) => id !== variantId).join(", "),
      );
    } else {
      handleChange("linked_variant_ids", [...current, variantId].join(", "));
    }
    setLinkedVariantSearch("");
    setShowLinkedVariantDropdown(false);
  };

  const selectedLinkedVariants = useMemo(() => {
    if (!formData.linked_variant_ids) return [];
    return formData.linked_variant_ids
      .split(",")
      .map((id: string) => id.trim())
      .filter((id: string) => id);
  }, [formData.linked_variant_ids]);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="variant_id">
            Variant <span className="text-red-500">*</span>
          </Label>
          <div className="relative">
            <div className="flex items-center">
              <Input
                placeholder={formData.variant_id || "Search variant..."}
                value={variantSearch}
                onChange={(e) => {
                  setVariantSearch(e.target.value);
                  setShowVariantDropdown(true);
                }}
                onFocus={() => setShowVariantDropdown(true)}
                className={errors.variant_id ? "border-red-500" : ""}
              />
            </div>
            {showVariantDropdown && filteredVariants.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg max-h-48 overflow-auto">
                {filteredVariants.slice(0, 20).map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => selectVariant(v.id)}
                    className={`w-full px-3 py-2 text-left hover:bg-slate-100 ${
                      formData.variant_id === v.id ? "bg-teal-50" : ""
                    }`}
                  >
                    <div className="font-medium">{v.id}</div>
                    {v.hgvs && (
                      <div className="text-xs text-slate-500">{v.hgvs}</div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
          {errors.variant_id && (
            <p className="text-xs text-red-500">{errors.variant_id}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="literature_id">
            Literature <span className="text-red-500">*</span>
          </Label>
          <div className="relative">
            <Input
              placeholder={formData.literature_id || "Search literature..."}
              value={literatureSearch}
              onChange={(e) => {
                setLiteratureSearch(e.target.value);
                setShowLiteratureDropdown(true);
              }}
              onFocus={() => setShowLiteratureDropdown(true)}
              className={errors.literature_id ? "border-red-500" : ""}
              disabled={!!initialData}
            />
            {showLiteratureDropdown && filteredLiterature.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg max-h-48 overflow-auto">
                {filteredLiterature.slice(0, 20).map((l) => (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => selectLiterature(l.id)}
                    className={`w-full px-3 py-2 text-left hover:bg-slate-100 ${
                      formData.literature_id === l.id ? "bg-teal-50" : ""
                    }`}
                  >
                    <div className="font-medium truncate">{l.id}</div>
                    {l.title && (
                      <div className="text-xs text-slate-500 truncate">
                        {l.title}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
          {errors.literature_id && (
            <p className="text-xs text-red-500">{errors.literature_id}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="clinical_significance">Clinical Significance</Label>
          <Select
            value={formData.clinical_significance}
            onValueChange={(value) =>
              handleChange("clinical_significance", value)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select significance" />
            </SelectTrigger>
            <SelectContent>
              {CLINICAL_SIGNIFICANCE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="zygosity">Zygosity</Label>
          <Select
            value={formData.zygosity}
            onValueChange={(value) => handleChange("zygosity", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select zygosity" />
            </SelectTrigger>
            <SelectContent>
              {ZYGOSITY_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="inheritance">Inheritance</Label>
          <Select
            value={formData.inheritance}
            onValueChange={(value) => handleChange("inheritance", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select inheritance" />
            </SelectTrigger>
            <SelectContent>
              {INHERITANCE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="disease">Disease</Label>
        <Input
          id="disease"
          value={formData.disease}
          onChange={(e) => handleChange("disease", e.target.value)}
          placeholder="e.g., Tos"
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="counts">Counts</Label>
          <Input
            id="counts"
            type="number"
            min="0"
            value={formData.counts}
            onChange={(e) => handleChange("counts", e.target.value)}
            placeholder="e.g., 1"
            className={errors.counts ? "border-red-500" : ""}
          />
          {errors.counts && (
            <p className="text-xs text-red-500">{errors.counts}</p>
          )}
        </div>

        <div className="col-span-2 space-y-2">
          <Label htmlFor="linked_variant_ids">Linked Variant IDs</Label>
          <div className="relative">
            <Input
              placeholder="Search to add linked variants..."
              value={linkedVariantSearch}
              onChange={(e) => {
                setLinkedVariantSearch(e.target.value);
                setShowLinkedVariantDropdown(true);
              }}
              onFocus={() => setShowLinkedVariantDropdown(true)}
              className={errors.linked_variant_ids ? "border-red-500" : ""}
            />
            {showLinkedVariantDropdown &&
              availableLinkedVariants.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg max-h-48 overflow-auto">
                  {availableLinkedVariants.slice(0, 20).map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => toggleLinkedVariant(v.id)}
                      className={`w-full px-3 py-2 text-left hover:bg-slate-100 flex items-center justify-between ${
                        selectedLinkedVariants.includes(v.id)
                          ? "bg-teal-50"
                          : ""
                      }`}
                    >
                      <span>{v.id}</span>
                      {selectedLinkedVariants.includes(v.id) && (
                        <span className="text-teal-600 text-xs">✓</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
          </div>
          {selectedLinkedVariants.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {selectedLinkedVariants.map((id: string) => (
                <span
                  key={id}
                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 rounded text-xs"
                >
                  {id}
                  <button
                    type="button"
                    onClick={() => toggleLinkedVariant(id)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
          {errors.linked_variant_ids && (
            <p className="text-xs text-red-500">{errors.linked_variant_ids}</p>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
        <Button type="button" variant="outline" onClick={onCancel}>
          <X className="h-4 w-4 mr-2" />
          Cancel
        </Button>
        <Button type="submit" className="bg-teal-600 hover:bg-teal-700">
          <Save className="h-4 w-4 mr-2" />
          {initialData ? "Update" : "Add"} Association
        </Button>
      </div>
    </form>
  );
};

export default VariantAssociationForm;
