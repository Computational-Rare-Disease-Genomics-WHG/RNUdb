import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { LoadingSpinner } from "./LoadingSpinner";

export function ProtectedEditor({ children }: { children: React.ReactNode }) {
  const { isCurator, isLoading } = useAuth();
  if (isLoading) return <LoadingSpinner />;
  return isCurator ? <>{children}</> : <Navigate to="/login" />;
}

export function ProtectedCurate({ children }: { children: React.ReactNode }) {
  const { isCurator, isLoading } = useAuth();
  if (isLoading) return <LoadingSpinner />;
  return isCurator ? <>{children}</> : <Navigate to="/login" />;
}

export function ProtectedAdmin({ children }: { children: React.ReactNode }) {
  const { isCurator, isLoading } = useAuth();
  if (isLoading) return <LoadingSpinner />;
  return isCurator ? <>{children}</> : <Navigate to="/login" />;
}
