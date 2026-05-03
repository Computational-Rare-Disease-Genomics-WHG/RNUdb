import { useState, useCallback } from "react";

export interface PendingChange {
  id: number;
  entity_type: string;
  entity_id: string | null;
  gene_id: string;
  action: string;
  payload: any;
  requested_by: string;
  requested_at: string;
  status: "pending" | "approved" | "rejected";
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
}

export function useApprovals() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitChange = useCallback(
    async (
      entityType: string,
      geneId: string,
      action: string,
      payload: any,
      entityId?: string,
    ): Promise<PendingChange | null> => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/approvals", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            entity_type: entityType,
            entity_id: entityId || null,
            gene_id: geneId,
            action,
            payload,
          }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.detail || "Failed to submit change");
        }
        return await res.json();
      } catch (err: any) {
        setError(err.message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const listChanges = useCallback(
    async (filters?: {
      status?: string;
      gene_id?: string;
      entity_type?: string;
    }): Promise<PendingChange[]> => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (filters?.status) params.set("status", filters.status);
        if (filters?.gene_id) params.set("gene_id", filters.gene_id);
        if (filters?.entity_type)
          params.set("entity_type", filters.entity_type);

        const res = await fetch(`/api/approvals?${params}`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to load changes");
        return await res.json();
      } catch (err: any) {
        setError(err.message);
        return [];
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const reviewChange = useCallback(
    async (
      changeId: number,
      status: "approved" | "rejected",
      notes?: string,
    ): Promise<PendingChange | null> => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/approvals/${changeId}/review`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ status, notes }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.detail || "Failed to review change");
        }
        return await res.json();
      } catch (err: any) {
        setError(err.message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const applyChange = useCallback(
    async (changeId: number): Promise<PendingChange | null> => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/approvals/${changeId}/apply`, {
          method: "POST",
          credentials: "include",
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.detail || "Failed to apply change");
        }
        return await res.json();
      } catch (err: any) {
        setError(err.message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return {
    submitChange,
    listChanges,
    reviewChange,
    applyChange,
    loading,
    error,
  };
}
