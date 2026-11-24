import { Save, X } from "lucide-react";
import React, { useMemo, useState } from "react";
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

interface Gene {
  id: string;
  name: string;
  chromosome: string;
  start: number;
  end: number;
}

interface EquivalenceFormProps {
  selectedGene: Gene;
  genes: Gene[];
  existingPairs: any[];
  onSubmit: (data: Record<string, unknown>) => void;
  onCancel: () => void;
}

/**
 * Add a single base-for-base equivalent position pair.
 *
 * The pair is stored ordered by gene id (gene_a < gene_b), matching the
 * database CHECK constraint, so the form normalises the order before submit.
 */
const EquivalenceForm: React.FC<EquivalenceFormProps> = ({
  selectedGene,
  genes,
  existingPairs,
  onSubmit,
  onCancel,
}) => {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [otherGene, setOtherGene] = useState("");
  const [selectedPos, setSelectedPos] = useState("");
  const [otherPos, setOtherPos] = useState("");
  const [notes, setNotes] = useState("");

  const geneLength = useMemo(
    () => selectedGene.end - selectedGene.start + 1,
    [selectedGene],
  );

  const otherGeneData = useMemo(
    () => genes.find((g) => g.id === otherGene),
    [genes, otherGene],
  );

  const otherGeneLength = useMemo(
    () => (otherGeneData ? otherGeneData.end - otherGeneData.start + 1 : 0),
    [otherGeneData],
  );

  const takenPositions = useMemo(() => {
    const taken = new Set<string>();
    for (const pair of existingPairs) {
      taken.add(`${pair.gene_a}:${pair.pos_a}`);
      taken.add(`${pair.gene_b}:${pair.pos_b}`);
    }
    return taken;
  }, [existingPairs]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: Record<string, string> = {};

    if (!otherGene) {
      nextErrors.otherGene = "Select the gene to map to";
    }
    if (otherGene === selectedGene.id) {
      nextErrors.otherGene = "Pick a different gene";
    }

    const posA = Number(selectedPos);
    const posB = Number(otherPos);

    if (!selectedPos || Number.isNaN(posA) || posA < 1) {
      nextErrors.selectedPos = "Enter a valid position";
    } else if (posA > geneLength) {
      nextErrors.selectedPos = `Position must be between 1 and ${geneLength}`;
    } else if (takenPositions.has(`${selectedGene.id}:${posA}`)) {
      nextErrors.selectedPos = "This position is already mapped";
    }

    if (!otherPos || Number.isNaN(posB) || posB < 1) {
      nextErrors.otherPos = "Enter a valid position";
    } else if (posB > otherGeneLength) {
      nextErrors.otherPos = `Position must be between 1 and ${otherGeneLength}`;
    } else if (takenPositions.has(`${otherGene}:${posB}`)) {
      nextErrors.otherPos = "This position is already mapped";
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    // Normalise order so gene_a < gene_b (database CHECK constraint).
    const selectedFirst = selectedGene.id < otherGene;
    onSubmit({
      gene_a: selectedFirst ? selectedGene.id : otherGene,
      pos_a: selectedFirst ? posA : posB,
      gene_b: selectedFirst ? otherGene : selectedGene.id,
      pos_b: selectedFirst ? posB : posA,
      notes: notes.trim() || null,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="other_gene">
          Map to gene <span className="text-red-500">*</span>
        </Label>
        <Select value={otherGene} onValueChange={setOtherGene}>
          <SelectTrigger id="other_gene">
            <SelectValue placeholder="Select a gene" />
          </SelectTrigger>
          <SelectContent>
            {genes
              .filter((g) => g.id !== selectedGene.id)
              .map((g) => (
                <SelectItem key={g.id} value={g.id}>
                  {g.name} ({g.id})
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
        {errors.otherGene && <p className="text-xs text-red-500">{errors.otherGene}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="selected_pos">
            {selectedGene.id} position <span className="text-red-500">*</span>
          </Label>
          <Input
            id="selected_pos"
            type="number"
            min={1}
            max={geneLength}
            value={selectedPos}
            onChange={(e) => setSelectedPos(e.target.value)}
            placeholder={`1–${geneLength}`}
          />
          {errors.selectedPos && (
            <p className="text-xs text-red-500">{errors.selectedPos}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="other_pos">
            {otherGene || "Other gene"} position <span className="text-red-500">*</span>
          </Label>
          <Input
            id="other_pos"
            type="number"
            min={1}
            max={otherGeneLength || undefined}
            value={otherPos}
            onChange={(e) => setOtherPos(e.target.value)}
            placeholder={otherGeneLength ? `1–${otherGeneLength}` : "—"}
            disabled={!otherGene}
          />
          {errors.otherPos && <p className="text-xs text-red-500">{errors.otherPos}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. K-turn / 5' stem-loop, base-identical"
          rows={2}
        />
      </div>

      <p className="text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-md p-3">
        Both positions must carry the same transcript base. The server validates this
        when the change is approved, and neither position may already be mapped.
      </p>

      <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
        <Button type="button" variant="outline" onClick={onCancel}>
          <X className="h-4 w-4 mr-2" />
          Cancel
        </Button>
        <Button type="submit" className="bg-teal-600 hover:bg-teal-700">
          <Save className="h-4 w-4 mr-2" />
          Submit for Approval
        </Button>
      </div>
    </form>
  );
};

export default EquivalenceForm;
