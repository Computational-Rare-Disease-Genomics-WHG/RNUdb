import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Admin from "../pages/Admin";
import Curate from "../pages/Curate";
import Editor from "../pages/Editor";

export function ProtectedEditor() {
  const { isCurator, isLoading } = useAuth();
  if (isLoading)
    return (
      <div className="min-h-screen flex items-center justify-center">Loading...</div>
    );
  return isCurator ? <Editor /> : <Navigate to="/login" />;
}

export function ProtectedCurate() {
  const { isCurator, isLoading } = useAuth();
  if (isLoading)
    return (
      <div className="min-h-screen flex items-center justify-center">Loading...</div>
    );
  return isCurator ? <Curate /> : <Navigate to="/login" />;
}

export function ProtectedAdmin() {
  const { isCurator, isLoading } = useAuth();
  if (isLoading)
    return (
      <div className="min-h-screen flex items-center justify-center">Loading...</div>
    );
  return isCurator ? <Admin /> : <Navigate to="/login" />;
}
