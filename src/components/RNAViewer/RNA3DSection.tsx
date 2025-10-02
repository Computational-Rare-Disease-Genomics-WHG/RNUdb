import React from "react";
import PDBViewer from "./PDBViewer";

const DEMO_PDB_URL = "/api/genes/rnu4-2/pdb";

const RNA3DSection: React.FC = () => {
  return (
    <div>
      <h3>3D Structure (PDB)</h3>
      <PDBViewer pdbUrl={DEMO_PDB_URL} height="400px" />
    </div>
  );
};

export default RNA3DSection;
