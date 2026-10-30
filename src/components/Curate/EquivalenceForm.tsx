import { Save, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { getAllVariants } from "@/services/api";
import type { Variant } from "@/types";

interface EquivalenceFormProps {
  localGeneId: string;
  localVariants: Variant[];
  initialData?: any | null;
  onSubmit: (data: Record<string, unknown>) => void;
  onCancel: () => void;
}

const EQUIVALENCE_OPTIONS = {
  relationship_type: [
    { value: "analog", label: "Analog (e.g. U4 ↔ U4atac)" },
    { value: "paralog", label: "Paralog (e.g. RNU6 copies)" },
  ],
  mechanism_match: [
    { value: "same", label: "Same (usable as evidence)" },
    { value: "different", label: "Different (do NOT use)" },
    { value: "unknown", label: "Unknown" },
  ],
  evidence_direction: [
    { value: "pathogenic", label: "Pathogenic (PM5)" },
    { value: "benign", label: "Benign (informative)" },
    { value: "both", label: "Both directions" },
  ],
  status: [
    { value: "needs_review", label: "Needs review" },
    { value: "reviewed", label: "Reviewed / confirmed" },
  ],
};

const EquivalenceForm = ({
  localGeneId,
  localVariants,
  initialData = null,
  onSubmit,
  onCancel,
}: EquivalenceFormProps) => {
  const [allVariants, setAllVariants] = useState<Variant[]>([]);
  const [variantSearch, setVariantSearch] = useState("");
  const [showVariantDropdown, setShowVariantDropdown] = useState(false);
  const [formData, setFormData] = useState({
    variant_id: initialData?.variant_id || "",
    equivalent_variant_id: initialData?.equivalent_variant_id || "",
    relationship_type: initialData?.relationship_type || "analog",
    mechanism_match: initialData?.mechanism_match || "same",
    functional_region: initialData?.functional_region || "",
    evidence_direction: initialData?.evidence_direction || "pathogenic",
    status: initialData?.status || "needs_review",
    notes: initialData?.notes || "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    getAllVariants()
      .then(setAllVariants)
      .catch(() => setAllVariants([]));
  }, []);

  // Filter out the local gene's own variants from the "other" pool so the
  // picker only offers cross-gene candidates.
  const otherVariants = useMemo(() => {
    return allVariants.filter((v) => v.geneId !== localGeneId);
  }, [allVariants, localGeneId]);

  const filteredOtherVariants = useMemo(() => {
    if (!variantSearch) return otherVariants;
    const search = variantSearch.toLowerCase();
    return otherVariants.filter(
      (v) =>
        v.id.toLowerCase().includes(search) ||
        (v.hgvs && v.hgvs.toLowerCase().includes(search)) ||
        v.geneId.toLowerCase().includes(search),
    );
  }, [otherVariants, variantSearch]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.variant_id) errs.variant_id = "Local variant is required";
    if (!formData.equivalent_variant_id)
      errs.equivalent_variant_id = "Equivalent variant is required";
    if (
      formData.variant_id &&
      formData.equivalent_variant_id &&
      formData.variant_id === formData.equivalent_variant_id
    ) {
      errs.equivalent_variant_id = "A variant cannot be equivalent to itself";
    }
    return errs;
  };

  const handleSubmit = () => {
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    onSubmit(formData);
  };

  const displayOther = (v: Variant | undefined) =>
    v ? `${v.geneId} · ${v.hgvs || `${v.ref}>${v.alt}`} · ${v.id}` : "";

  const selectedOther =
    allVariants.find((v) => v.id === formData.equivalent_variant_id) ||
    otherVariants.find((v) => v.id === formData.equivalent_variant_id);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Local variant (this gene) */}
        <div>
          <Label className="text-sm font-medium text-slate-700">
            Local Variant ({localGeneId})
          </Label>
          <Select
            value={formData.variant_id || undefined}
            onValueChange={(v) => setFormData({ ...formData, variant_id: v })}
          >
            <SelectTrigger className="mt-1.5">
              <SelectValue placeholder="Select a variant in this gene" />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              {localVariants.map((v) => (
                <SelectItem key={v.id} value={v.id}>
                  {v.hgvs || v.id} ({v.id})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.variant_id && (
            <p className="text-xs text-red-600 mt-1">{errors.variant_id}</p>
          )}
        </div>

        {/* Other variant (paralog/analog gene) */}
        <div>
          <Label className="text-sm font-medium text-slate-700">
            Equivalent Variant (other gene)
          </Label>
          <div className="relative mt-1.5">
            <Input
              value={
                showVariantDropdown
                  ? variantSearch
                  : formData.equivalent_variant_id
                    ? displayOther(selectedOther) || formData.equivalent_variant_id
                    : ""
              }
              placeholder="Search variants in other genes..."
              onFocus={() => setShowVariantDropdown(true)}
              onChange={(e) => {
                setVariantSearch(e.target.value);
                setShowVariantDropdown(true);
                if (!showVariantDropdown) {
                  setFormData({ ...formData, equivalent_variant_id: "" });
                }
              }}
              onBlur={() => setTimeout(() => setShowVariantDropdown(false), 150)}
            />
            {showVariantDropdown && (
              <div className="absolute z-40 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-64 overflow-y-auto">
                {filteredOtherVariants.length === 0 ? (
                  <div className="px-4 py-3 text-sm text-slate-500">
                    No variants in other genes found
                  </div>
                ) : (
                  filteredOtherVariants.slice(0, 100).map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setFormData({
                          ...formData,
                          equivalent_variant_id: v.id,
                        });
                        setShowVariantDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-teal-50 text-sm"
                    >
                      <span className="font-medium text-slate-800">
                        {v.geneId} · {v.hgvs || `${v.ref}>${v.alt}`}
                      </span>
                      <span className="text-xs text-slate-400 font-mono ml-2">
                        {v.id}
                      </span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
          {errors.equivalent_variant_id && (
            <p className="text-xs text-red-600 mt-1">{errors.equivalent_variant_id}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-sm font-medium text-slate-700">
            Relationship Type
          </Label>
          <Select
            value={formData.relationship_type}
            onValueChange={(v) => setFormData({ ...formData, relationship_type: v })}
          >
            <SelectTrigger className="mt-1.5">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {EQUIVALENCE_OPTIONS.relationship_type.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-sm font-medium text-slate-700">Mechanism Match</Label>
          <Select
            value={formData.mechanism_match}
            onValueChange={(v) => setFormData({ ...formData, mechanism_match: v })}
          >
            <SelectTrigger className="mt-1.5">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {EQUIVALENCE_OPTIONS.mechanism_match.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {formData.mechanism_match !== "same" && (
            <p className="text-xs text-amber-600 mt-1">
              Pairs with a different/unknown mechanism are excluded from PM5 evidence.
            </p>
          )}
        </div>
        <div>
          <Label className="text-sm font-medium text-slate-700">
            Evidence Direction
          </Label>
          <Select
            value={formData.evidence_direction}
            onValueChange={(v) => setFormData({ ...formData, evidence_direction: v })}
          >
            <SelectTrigger className="mt-1.5">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {EQUIVALENCE_OPTIONS.evidence_direction.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-sm font-medium text-slate-700">Status</Label>
          <Select
            value={formData.status}
            onValueChange={(v) => setFormData({ ...formData, status: v })}
          >
            <SelectTrigger className="mt-1.5">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {EQUIVALENCE_OPTIONS.status.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label className="text-sm font-medium text-slate-700">Functional Region</Label>
        <Input
          className="mt-1.5"
          placeholder={String.raw`e.g. "Sm binding site", "5' stem-loop", "Stem III"`}
          value={formData.functional_region}
          onChange={(e) =>
            setFormData({ ...formData, functional_region: e.target.value })
          }
        />
      </div>

      <div>
        <Label className="text-sm font-medium text-slate-700">Notes</Label>
        <Textarea
          className="mt-1.5"
          rows={3}
          placeholder="Source of the equivalence, anti-circularity basis, exact-equivalence rationale..."
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
        />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button variant="outline" onClick={onCancel}>
          <X className="h-4 w-4 mr-2" />
          Cancel
        </Button>
        <Button onClick={handleSubmit} className="bg-teal-600 hover:bg-teal-700">
          <Save className="h-4 w-4 mr-2" />
          Submit for Approval
        </Button>
      </div>
    </div>
  );
};

export default EquivalenceForm;
