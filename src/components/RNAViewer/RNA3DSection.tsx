import React from "react";
import PDBViewer from "./PDBViewer";

const RNA3DSection: React.FC = () => {
  return (
    <div>
      <h3>3D Structure (PDB)</h3>
      <PDBViewer pdbData={null} height="400px" />
    </div>
  );
};

export default RNA3DSection;
