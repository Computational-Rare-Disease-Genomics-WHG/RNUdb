import { Save, X, Loader2, Search } from "lucide-react";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface LiteratureFormProps {
  initialData?: any | null;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

const LiteratureForm = ({
  initialData,
  onSubmit,
  onCancel,
}: LiteratureFormProps) => {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [fetching, setFetching] = useState(false);
  const [fetchError, setFetchError] = useState("");

  const [formData, setFormData] = useState({
    id: initialData?.id || "",
    title: initialData?.title || "",
    authors: initialData?.authors || "",
    journal: initialData?.journal || "",
    year: initialData?.year || "",
    doi: initialData?.doi || "",
    pmid: initialData?.pmid || "",
    url: initialData?.url || "",
  });

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.id.trim()) {
      newErrors.id = "DOI is required (used as ID)";
    }

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    }

    if (!formData.authors.trim()) {
      newErrors.authors = "Authors is required";
    }

    if (!formData.journal.trim()) {
      newErrors.journal = "Journal is required";
    }

    if (!formData.year.trim()) {
      newErrors.year = "Year is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleFetchFromPubMed = async () => {
    const identifier = formData.id.trim();
    if (!identifier) {
      setFetchError("Please enter a DOI or PMID first");
      return;
    }

    setFetching(true);
    setFetchError("");

    try {
      const res = await fetch("/api/imports/literature/fetch", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier }),
      });

      const data = await res.json();

      if (data.success) {
        setFormData((prev) => ({
          ...prev,
          title: data.title || prev.title,
          authors: data.authors || prev.authors,
          journal: data.journal || prev.journal,
          year: data.year || prev.year,
          pmid: data.pmid || prev.pmid,
          url: data.url || prev.url,
        }));
      } else {
        setFetchError(data.error || "Failed to fetch data from PubMed");
      }
    } catch {
      setFetchError("Network error fetching from PubMed");
    } finally {
      setFetching(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="id">
          DOI <span className="text-red-500">*</span>
        </Label>
        <div className="flex gap-2">
          <Input
            id="id"
            value={formData.id}
            onChange={(e) => handleChange("id", e.target.value)}
            placeholder="e.g., 10.1000/xyz123 or PMID"
            className={errors.id ? "border-red-500" : ""}
            disabled={!!initialData}
          />
          <Button
            type="button"
            variant="outline"
            onClick={handleFetchFromPubMed}
            disabled={fetching || !formData.id.trim() || !!initialData}
            className="shrink-0"
          >
            {fetching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4 mr-2" />
            )}
            Fetch
          </Button>
        </div>
        {errors.id && <p className="text-xs text-red-500">{errors.id}</p>}
        <p className="text-xs text-slate-500">
          DOI or PMID used as the unique identifier
        </p>
        {fetchError && <p className="text-xs text-red-500">{fetchError}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="title">
          Title <span className="text-red-500">*</span>
        </Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => handleChange("title", e.target.value)}
          placeholder="Paper title"
          className={errors.title ? "border-red-500" : ""}
        />
        {errors.title && <p className="text-xs text-red-500">{errors.title}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="authors">
          Authors <span className="text-red-500">*</span>
        </Label>
        <Input
          id="authors"
          value={formData.authors}
          onChange={(e) => handleChange("authors", e.target.value)}
          placeholder="e.g., Smith J, Doe A"
          className={errors.authors ? "border-red-500" : ""}
        />
        {errors.authors && (
          <p className="text-xs text-red-500">{errors.authors}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="journal">
            Journal <span className="text-red-500">*</span>
          </Label>
          <Input
            id="journal"
            value={formData.journal}
            onChange={(e) => handleChange("journal", e.target.value)}
            placeholder="e.g., Nature"
            className={errors.journal ? "border-red-500" : ""}
          />
          {errors.journal && (
            <p className="text-xs text-red-500">{errors.journal}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="year">
            Year <span className="text-red-500">*</span>
          </Label>
          <Input
            id="year"
            value={formData.year}
            onChange={(e) => handleChange("year", e.target.value)}
            placeholder="e.g., 2024"
            className={errors.year ? "border-red-500" : ""}
          />
          {errors.year && <p className="text-xs text-red-500">{errors.year}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="pmid">PMID</Label>
          <Input
            id="pmid"
            value={formData.pmid}
            onChange={(e) => handleChange("pmid", e.target.value)}
            placeholder="PubMed ID (auto-filled)"
            disabled
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="url">URL</Label>
          <Input
            id="url"
            value={formData.url}
            onChange={(e) => handleChange("url", e.target.value)}
            placeholder="Link to paper (auto-filled)"
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
        <Button type="button" variant="outline" onClick={onCancel}>
          <X className="h-4 w-4 mr-2" />
          Cancel
        </Button>
        <Button type="submit" className="bg-teal-600 hover:bg-teal-700">
          <Save className="h-4 w-4 mr-2" />
          {initialData ? "Update" : "Add"} Literature
        </Button>
      </div>
    </form>
  );
};

export default LiteratureForm;
