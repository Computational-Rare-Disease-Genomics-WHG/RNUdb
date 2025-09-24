import React, { useState } from "react";
import RNAViewer from "./RNAViewer";
import PDBViewer from "./PDBViewer";

interface RNAViewerPanelProps {
  pdbUrl: string;
  rna2dProps?: React.ComponentProps<typeof RNAViewer>;
}

const RNAViewerPanel: React.FC<RNAViewerPanelProps> = ({ pdbUrl, rna2dProps }) => {
  const [show3D, setShow3D] = useState(false);

  return (
    <div>
      <div style={{ marginBottom: 12 }}>
        <button
          onClick={() => setShow3D((v) => !v)}
          style={{
            padding: "6px 16px",
            borderRadius: 4,
            border: "1px solid #888",
            background: show3D ? "#e0e7ff" : "#f3f4f6",
            cursor: "pointer",
            fontWeight: 500,
          }}
        >
          {show3D ? "Show 2D Structure" : "Show 3D Structure"}
        </button>
      </div>
      {show3D ? (
        <PDBViewer pdbUrl={pdbUrl} height="400px" />
      ) : (
        <RNAViewer {...(rna2dProps || {})} />
      )}
    </div>
  );
};

export default RNAViewerPanel;
