import { Badge } from "@/components/ui/badge";

/** "clinvar_20261108" → "2026-11-08"; anything else is returned unchanged. */
export const formatClinvarRelease = (release: string): string => {
  const match = /^clinvar_(\d{4})(\d{2})(\d{2})$/.exec(release);
  return match ? `${match[1]}-${match[2]}-${match[3]}` : release;
};

interface ClinVarPillProps {
  reviewStatus?: string | null;
  release?: string | null;
}

/** Marks a classification that comes from ClinVar rather than expert curation. */
export const ClinVarPill: React.FC<ClinVarPillProps> = ({ reviewStatus, release }) => {
  const title = [reviewStatus, release && formatClinvarRelease(release)]
    .filter(Boolean)
    .join(" · ");
  return (
    <Badge
      variant="outline"
      className="text-[10px] px-1.5 py-0 border-indigo-300 text-indigo-700"
      title={title || undefined}
    >
      ClinVar
    </Badge>
  );
};
