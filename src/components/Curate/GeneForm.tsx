import { Save, X, Database, Trash2, RefreshCw } from "lucide-react";
import React, { useState } from "react";
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

interface GeneFormProps {
  initialData?:
    | {
        id: string;
        name: string;
        fullName: string;
        chromosome: string;
        start: number;
        end: number;
        strand: string;
        sequence: string;
        description: string;
      }
    | null
    | undefined;
  onSubmit: (data: any) => void;
  onCancel: () => void;
  onDelete?: () => void;
  onRefreshVariants?: () => void;
}

const VALID_CHROMOSOMES = [
  "chr1",
  "chr2",
  "chr3",
  "chr4",
  "chr5",
  "chr6",
  "chr7",
  "chr8",
  "chr9",
  "chr10",
  "chr11",
  "chr12",
  "chr13",
  "chr14",
  "chr15",
  "chr16",
  "chr17",
  "chr18",
  "chr19",
  "chr20",
  "chr21",
  "chr22",
  "chrX",
  "chrY",
  "chrMT",
];
const VALID_BASES = /^[ATCGUatcgu]*$/;

const GeneForm = (props: GeneFormProps) => {
  const { initialData, onSubmit, onCancel, onDelete, onRefreshVariants } =
    props;

  const [formData, setFormData] = useState({
    id: initialData?.id || "",
    name: initialData?.name || "",
    fullName: initialData?.fullName || "",
    chromosome: initialData?.chromosome || "",
    start: initialData?.start || "",
    end: initialData?.end || "",
    strand: initialData?.strand || "+",
    sequence: initialData?.sequence || "",
    description: initialData?.description || "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [fetchPopulationData, setFetchPopulationData] = useState(true);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    const chrom = formData.chromosome.toLowerCase();
    if (!VALID_CHROMOSOMES.includes(chrom)) {
      newErrors.chromosome = "Must be chr1-chr22, chrX, chrY, or chrMT";
    }

    const start = Number(formData.start);
    const end = Number(formData.end);
    if (isNaN(start) || start < 1) {
      newErrors.start = "Must be a positive number";
    }
    if (isNaN(end) || end < 1) {
      newErrors.end = "Must be a positive number";
    }
    if (!isNaN(start) && !isNaN(end) && start >= end) {
      newErrors.end = "End must be greater than Start";
    }

    const seq = formData.sequence.toUpperCase();
    if (seq && !VALID_BASES.test(seq)) {
      newErrors.sequence = "Invalid characters. Use A, T, C, G, U only";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }
    onSubmit({
      ...formData,
      start: Number(formData.start),
      end: Number(formData.end),
      fetch_population_data: fetchPopulationData,
    });
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="block text-sm font-medium text-slate-700 mb-1">
            Gene ID
          </Label>
          <Input
            value={formData.id}
            onChange={(e) => handleChange("id", e.target.value)}
            placeholder="e.g., RNU4-2"
            required
            disabled={!!initialData}
          />
        </div>
        <div>
          <Label className="block text-sm font-medium text-slate-700 mb-1">
            Name
          </Label>
          <Input
            value={formData.name}
            onChange={(e) => handleChange("name", e.target.value)}
            placeholder="e.g., RNU4-2"
            required
          />
        </div>
      </div>

      <div>
        <Label className="block text-sm font-medium text-slate-700 mb-1">
          Full Name
        </Label>
        <Input
          value={formData.fullName}
          onChange={(e) => handleChange("fullName", e.target.value)}
          placeholder="e.g., RNA, U4 small nuclear 2"
          required
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label className="block text-sm font-medium text-slate-700 mb-1">
            Chromosome
          </Label>
          <Input
            value={formData.chromosome}
            onChange={(e) => handleChange("chromosome", e.target.value)}
            placeholder="e.g., chr12 or chrX"
            required
          />
          {errors.chromosome && (
            <p className="text-xs text-red-500 mt-1">{errors.chromosome}</p>
          )}
        </div>
        <div>
          <Label className="block text-sm font-medium text-slate-700 mb-1">
            Start
          </Label>
          <Input
            type="number"
            value={formData.start}
            onChange={(e) => handleChange("start", e.target.value)}
            placeholder="Genomic start position"
            required
          />
          {errors.start && (
            <p className="text-xs text-red-500 mt-1">{errors.start}</p>
          )}
        </div>
        <div>
          <Label className="text-sm font-medium text-slate-700 mb-1">End</Label>
          <Input
            type="number"
            value={formData.end}
            onChange={(e) => handleChange("end", e.target.value)}
            placeholder="Genomic end position"
            required
          />
          {errors.end && (
            <p className="text-xs text-red-500 mt-1">{errors.end}</p>
          )}
        </div>
      </div>

      <div>
        <Label className="text-sm font-medium text-slate-700 mb-1">
          Strand
        </Label>
        <Select
          value={formData.strand}
          onValueChange={(value) => handleChange("strand", value)}
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
        <Label className="text-sm font-medium text-slate-700 mb-1">
          Sequence
        </Label>
        <Textarea
          value={formData.sequence}
          onChange={(e) => handleChange("sequence", e.target.value)}
          placeholder="RNA sequence (A, T, C, G, U)"
          rows={3}
          required
        />
        {errors.sequence && (
          <p className="text-xs text-red-500 mt-1">{errors.sequence}</p>
        )}
      </div>

      <div>
        <Label className="text-sm font-medium text-slate-700 mb-1">
          Description
        </Label>
        <Textarea
          value={formData.description}
          onChange={(e) => handleChange("description", e.target.value)}
          placeholder="Gene description"
          rows={2}
          required
        />
      </div>

      {!initialData && (
        <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
          <input
            type="checkbox"
            id="fetch-population"
            checked={fetchPopulationData}
            onChange={(e) => setFetchPopulationData(e.target.checked)}
            className="h-4 w-4 text-teal-600 rounded border-slate-300"
          />
          <Label
            htmlFor="fetch-population"
            className="text-sm font-medium text-slate-700 cursor-pointer"
          >
            <Database className="h-4 w-4 inline mr-1" />
            Fetch population data from gnomAD and All of Us
          </Label>
        </div>
      )}

      <div className="flex gap-3 pt-4">
        <Button
          type="submit"
          className="bg-teal-600 hover:bg-teal-700 text-white"
        >
          <Save className="h-4 w-4 mr-2" />
          {initialData ? "Update Gene" : "Create Gene"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          <X className="h-4 w-4 mr-2" />
          Cancel
        </Button>
        {initialData && onDelete && (
          <Button
            type="button"
            variant="outline"
            className="ml-auto text-red-600 border-red-300 hover:bg-red-50 hover:text-red-700 hover:border-red-400"
            onClick={onDelete}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        )}
        {initialData && onRefreshVariants && (
          <Button
            type="button"
            variant="outline"
            className="text-amber-600 border-amber-300 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-400"
            onClick={onRefreshVariants}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Population Variants
          </Button>
        )}
      </div>
    </form>
  );
};

export default GeneForm;
