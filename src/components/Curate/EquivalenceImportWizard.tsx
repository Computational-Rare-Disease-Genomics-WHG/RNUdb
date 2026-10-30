import { Upload, X, FileWarning, CheckCircle2 } from "lucide-react";
import React, { useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { getAllVariants } from "@/services/api";
import type { Variant } from "@/types";

type PreviewRow = {
  row: number;
  valid: boolean;
  error?: string;
  data: Record<string, string>;
};

interface EquivalenceImportWizardProps {
  open: boolean;
  onClose: () => void;
  onImport: (rows: Record<string, unknown>[]) => Promise<void>;
}

const REQUIRED_COLUMNS = ["variant_id", "equivalent_variant_id", "relationship_type"];

const OPTIONAL_COLUMNS = ["status", "notes", "literature_id"];

const ALL_COLUMNS = [...REQUIRED_COLUMNS, ...OPTIONAL_COLUMNS];

const DEFAULT_VALUES: Record<string, string> = {
  relationship_type: "analog",
  status: "needs_review",
};

const EQUIVALENCE_HEADER =
  "variant_id,equivalent_variant_id,relationship_type,status,notes,literature_id\nchr12-120291872-C-T,chr2-121530916-G-A,analog,needs_review,Curated anchor,\n";

function parseCsv(content: string): { headers: string[]; rows: string[][] } {
  const lines = content
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  const headers = lines[0].split(",").map((h) => h.trim().replace(/^["']|["']$/g, ""));
  const rows = lines.slice(1).map((line) => {
    // Minimal CSV handling: split on commas outside quotes.
    const out: string[] = [];
    let cur = "";
    let inQuotes = false;
    for (const ch of line) {
      if (ch === '"') inQuotes = !inQuotes;
      else if (ch === "," && !inQuotes) {
        out.push(cur.trim());
        cur = "";
      } else cur += ch;
    }
    out.push(cur.trim());
    return out;
  });
  return { headers, rows };
}

const EquivalenceImportWizard = ({
  open,
  onClose,
  onImport,
}: EquivalenceImportWizardProps) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [content, setContent] = useState("");
  const [allVariants, setAllVariants] = useState<Variant[]>([]);
  const [importing, setImporting] = useState(false);
  const [done, setDone] = useState<number | null>(null);

  const loadVariants = () => {
    getAllVariants()
      .then(setAllVariants)
      .catch(() => setAllVariants([]));
  };

  React.useEffect(() => {
    if (open) loadVariants();
  }, [open]);

  const variantIds = useMemo(
    () => new Set(allVariants.map((v) => v.id)),
    [allVariants],
  );
  const variantById = useMemo(
    () => new Map(allVariants.map((v) => [v.id, v])),
    [allVariants],
  );

  const previewRows: PreviewRow[] = useMemo(() => {
    if (!content.trim()) return [];
    const { headers, rows } = parseCsv(content);
    const missing = REQUIRED_COLUMNS.filter((c) => !headers.includes(c));
    if (missing.length > 0) {
      return [
        {
          row: 0,
          valid: false,
          error: `Missing required column(s): ${missing.join(", ")}. Expected: ${ALL_COLUMNS.join(", ")}`,
          data: {},
        },
      ];
    }
    const parsed = rows.map((cells, i) => {
      const data: Record<string, string> = {};
      headers.forEach((h, idx) => {
        data[h] = cells[idx] ?? "";
      });
      const v1 = data.variant_id || "";
      const v2 = data.equivalent_variant_id || "";
      let error: string | undefined;
      if (!v1 || !v2) error = "Both variant IDs are required";
      else if (v1 === v2) error = "A variant cannot be equivalent to itself";
      else if (!variantIds.has(v1)) error = `Unknown variant: ${v1}`;
      else if (!variantIds.has(v2)) error = `Unknown variant: ${v2}`;
      else {
        const g1 = variantById.get(v1)?.geneId;
        const g2 = variantById.get(v2)?.geneId;
        if (g1 && g2 && g1 === g2) error = `Same gene (${g1}) — must be cross-gene`;
      }
      return { row: i + 2, valid: !error, error, data };
    });
    return parsed;
  }, [content, variantIds, variantById]);

  const validRows = useMemo(
    () =>
      previewRows
        .filter((r) => r.valid)
        .map((r) => {
          const row: Record<string, unknown> = { ...r.data };
          for (const [k, def] of Object.entries(DEFAULT_VALUES)) {
            if (!row[k] || !String(row[k]).trim()) row[k] = def;
          }
          return row;
        }),
    [previewRows],
  );

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      setContent(String(reader.result || ""));
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (validRows.length === 0) return;
    setImporting(true);
    try {
      await onImport(validRows);
      setDone(validRows.length);
      setContent("");
    } finally {
      setImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Import Equivalent Variants</DialogTitle>
          <DialogDescription>
            Upload a CSV/JSON of equivalence pairs to submit for approval. Every row
            becomes a pending change reviewed by an admin.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <Input
              ref={fileRef}
              type="file"
              accept=".csv,.json,.txt"
              className="max-w-xs"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileRef.current?.click()}
            >
              <Upload className="h-4 w-4 mr-2" />
              Choose file
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setContent(EQUIVALENCE_HEADER);
              }}
            >
              Load example
            </Button>
          </div>

          <div>
            <div className="text-xs text-slate-500 mb-1">
              …or paste CSV (header required: variant_id, equivalent_variant_id,
              relationship_type, status, notes, literature_id)
            </div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
              className="w-full text-xs font-mono p-3 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-500"
              placeholder={EQUIVALENCE_HEADER}
            />
          </div>

          {previewRows.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium text-slate-700">
                  Preview: {validRows.length} valid / {previewRows.length} rows
                </div>
                {previewRows.some((r) => !r.valid) && (
                  <span className="flex items-center gap-1 text-xs text-amber-600">
                    <FileWarning className="h-3.5 w-3.5" />
                    Invalid rows are skipped
                  </span>
                )}
              </div>
              <div className="max-h-64 overflow-y-auto border border-slate-200 rounded-lg">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-slate-100">
                    <tr className="text-left text-slate-500">
                      <th className="px-3 py-2">#</th>
                      <th className="px-3 py-2">variant_id</th>
                      <th className="px-3 py-2">equivalent_variant_id</th>
                      <th className="px-3 py-2">relation</th>
                      <th className="px-3 py-2">status</th>
                      <th className="px-3 py-2">notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((r) => (
                      <tr
                        key={r.row}
                        className={`border-t border-slate-100 ${r.valid ? "" : "bg-red-50"}`}
                      >
                        <td className="px-3 py-1.5 text-slate-400">{r.row}</td>
                        <td className="px-3 py-1.5 font-mono">
                          {r.data.variant_id || "—"}
                        </td>
                        <td className="px-3 py-1.5 font-mono">
                          {r.data.equivalent_variant_id || "—"}
                        </td>
                        <td className="px-3 py-1.5">
                          {r.data.relationship_type || "—"}
                        </td>
                        <td className="px-3 py-1.5">
                          {r.data.status || "needs_review"}
                        </td>
                        <td className="px-3 py-1.5 text-red-600" title={r.error}>
                          {r.valid ? "" : r.error}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {done !== null && (
            <div className="flex items-center gap-2 text-sm text-emerald-600">
              <CheckCircle2 className="h-4 w-4" />
              {done} row(s) submitted for approval.
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={onClose}>
              <X className="h-4 w-4 mr-2" />
              Close
            </Button>
            <Button
              onClick={handleImport}
              disabled={validRows.length === 0 || importing}
              className="bg-teal-600 hover:bg-teal-700"
            >
              <Upload className="h-4 w-4 mr-2" />
              {importing ? "Submitting…" : `Submit ${validRows.length} for approval`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EquivalenceImportWizard;
