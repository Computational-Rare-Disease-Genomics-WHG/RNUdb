import { Save, X } from "lucide-react";
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
  const [formData, setFormData] = useState({
    id: initialData?.id || "",
    title: initialData?.title || "",
    authors: initialData?.authors || "",
    journal: initialData?.journal || "",
    year: initialData?.year || "",
    doi: initialData?.doi || "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label className="text-sm font-medium text-slate-700 mb-1">
          Literature ID
        </Label>
        <Input
          value={formData.id}
          onChange={(e) => setFormData({ ...formData, id: e.target.value })}
          placeholder="e.g., pmid12345678"
          required
          disabled={!!initialData}
        />
      </div>

      <div>
        <Label className="text-sm font-medium text-slate-700 mb-1">Title</Label>
        <Input
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Paper title"
          required
        />
      </div>

      <div>
        <Label className="text-sm font-medium text-slate-700 mb-1">
          Authors
        </Label>
        <Input
          value={formData.authors}
          onChange={(e) =>
            setFormData({ ...formData, authors: e.target.value })
          }
          placeholder="Author list"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-sm font-medium text-slate-700 mb-1">
            Journal
          </Label>
          <Input
            value={formData.journal}
            onChange={(e) =>
              setFormData({ ...formData, journal: e.target.value })
            }
            placeholder="Journal name"
            required
          />
        </div>
        <div>
          <Label className="text-sm font-medium text-slate-700 mb-1">
            Year
          </Label>
          <Input
            value={formData.year}
            onChange={(e) => setFormData({ ...formData, year: e.target.value })}
            placeholder="Publication year"
            required
          />
        </div>
      </div>

      <div>
        <Label className="text-sm font-medium text-slate-700 mb-1">DOI</Label>
        <Input
          value={formData.doi}
          onChange={(e) => setFormData({ ...formData, doi: e.target.value })}
          placeholder="DOI"
          required
        />
      </div>

      <div className="flex gap-3 pt-4">
        <Button
          type="submit"
          className="bg-teal-600 hover:bg-teal-700 text-white"
        >
          <Save className="h-4 w-4 mr-2" />
          {initialData ? "Update Literature" : "Create Literature"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          <X className="h-4 w-4 mr-2" />
          Cancel
        </Button>
      </div>
    </form>
  );
};

export default LiteratureForm;
