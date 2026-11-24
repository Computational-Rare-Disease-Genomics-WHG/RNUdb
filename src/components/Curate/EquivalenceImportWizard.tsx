import { AlertCircle, CheckCircle2, FileText, Upload } from "lucide-react";
import React, { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

interface Gene {
  id: string;
  name: string;
  chromosome: string;
  start: number;
  end: number;
}

interface EquivalenceImportWizardProps {
  open: boolean;
  onClose: () => void;
  geneId: string;
  genes: Gene[];
  onImport: (pairs: Record<string, unknown>[]) => void;
}

interface ParsedRow {
  gene_a: string;
  pos_a: number;
  gene_b: string;
  pos_b: number;
  notes: string | null;
  error?: string;
}

const HEADER = ["gene_a", "pos_a", "gene_b", "pos_b", "notes"];

const EquivalenceImportWizard: React.FC<EquivalenceImportWizardProps> = ({
  open,
  onClose,
  geneId,
  genes,
  onImport,
}) => {
  const [csvText, setCsvText] = useState("");

  const geneIds = useMemo(() => new Set(genes.map((g) => g.id)), [genes]);

  const rows = useMemo<ParsedRow[]>(() => {
    const lines = csvText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length === 0) return [];

    const start = lines[0].toLowerCase().startsWith("gene_a") ? 1 : 0;
    const parsed: ParsedRow[] = [];

    for (let i = start; i < lines.length; i++) {
      const cells = lines[i].split(",").map((c) => c.trim());
      const [gene_a, pos_a, gene_b, pos_b, notes] = cells;

      const row: ParsedRow = {
        gene_a: gene_a || "",
        pos_a: Number(pos_a),
        gene_b: gene_b || "",
        pos_b: Number(pos_b),
        notes: notes || null,
      };

      if (!row.gene_a || !row.gene_b) {
        row.error = "Missing gene";
      } else if (!geneIds.has(row.gene_a) || !geneIds.has(row.gene_b)) {
        row.error = "Unknown gene";
      } else if (row.gene_a === row.gene_b) {
        row.error = "Same gene";
      } else if (
        !Number.isInteger(row.pos_a) ||
        row.pos_a < 1 ||
        !Number.isInteger(row.pos_b) ||
        row.pos_b < 1
      ) {
        row.error = "Invalid position";
      } else if (row.gene_a > row.gene_b) {
        // Normalise to satisfy the database CHECK constraint.
        row.gene_a = gene_b;
        row.gene_b = gene_a;
        row.pos_a = Number(pos_b);
        row.pos_b = Number(pos_a);
      }

      parsed.push(row);
    }
    return parsed;
  }, [csvText, geneIds]);

  const validRows = rows.filter((r) => !r.error);
  const invalidRows = rows.filter((r) => r.error);

  const handleFile = async (file: File) => {
    setCsvText(await file.text());
  };

  const handleSubmit = () => {
    if (validRows.length === 0) return;
    onImport(
      validRows.map((r) => ({
        gene_a: r.gene_a,
        pos_a: r.pos_a,
        gene_b: r.gene_b,
        pos_b: r.pos_b,
        notes: r.notes,
      })),
    );
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[760px]">
        <DialogHeader>
          <DialogTitle>Import Equivalent Positions</DialogTitle>
          <DialogDescription>
            Paste CSV or choose a file. Header:{" "}
            <code className="text-xs">{HEADER.join(",")}</code>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <label className="inline-flex items-center gap-2 text-sm text-teal-700 border border-teal-200 bg-teal-50 hover:bg-teal-100 rounded-md px-3 py-2 cursor-pointer">
              <Upload className="h-4 w-4" />
              Choose CSV file
              <input
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(file);
                }}
              />
            </label>
            <span className="text-xs text-slate-500">
              …or paste below. Gene pairs are normalised to satisfy the gene_a &lt;
              gene_b constraint.
            </span>
          </div>

          <Textarea
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            rows={7}
            placeholder={`${HEADER.join(",")}\nRNU4-2,27,RNU4atac,32,K-turn / 5' stem-loop`}
            className="font-mono text-xs"
          />

          {rows.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Badge variant="secondary" className="bg-teal-50 text-teal-700">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  {validRows.length} valid
                </Badge>
                {invalidRows.length > 0 && (
                  <Badge variant="secondary" className="bg-red-50 text-red-700">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {invalidRows.length} invalid
                  </Badge>
                )}
              </div>

              <div className="max-h-56 overflow-auto border border-slate-200 rounded-md">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 sticky top-0">
                    <tr>
                      <th className="text-left px-3 py-2 font-medium">#</th>
                      <th className="text-left px-3 py-2 font-medium">Pair</th>
                      <th className="text-left px-3 py-2 font-medium">Notes</th>
                      <th className="text-left px-3 py-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, i) => (
                      <tr key={i} className="border-t border-slate-100">
                        <td className="px-3 py-2 text-slate-400">{i + 1}</td>
                        <td className="px-3 py-2 font-mono">
                          {row.gene_a} n.{row.pos_a} ↔ {row.gene_b} n.{row.pos_b}
                        </td>
                        <td className="px-3 py-2 text-slate-500 truncate max-w-[220px]">
                          {row.notes || "—"}
                        </td>
                        <td className="px-3 py-2">
                          {row.error ? (
                            <span className="text-red-600">{row.error}</span>
                          ) : (
                            <span className="text-teal-700">ok</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-slate-200">
            <p className="text-xs text-slate-500">
              <FileText className="inline h-3 w-3 mr-1" />
              Imported as one pending change for the selected gene ({geneId}).
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                className="bg-teal-600 hover:bg-teal-700"
                disabled={validRows.length === 0}
                onClick={handleSubmit}
              >
                Submit {validRows.length} pair(s)
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EquivalenceImportWizard;
