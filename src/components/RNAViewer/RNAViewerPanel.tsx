import React, { useState } from "react";
import PDBViewer from "./PDBViewer";
import RNAViewer from "./RNAViewer";
import type { PDBStructure } from "@/types";

interface RNAViewerPanelProps {
  pdbData: PDBStructure | null;
  rna2dProps?: React.ComponentProps<typeof RNAViewer>;
}

const RNAViewerPanel: React.FC<RNAViewerPanelProps> = ({
  pdbData,
  rna2dProps,
}) => {
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
        <PDBViewer pdbData={pdbData} height="400px" />
      ) : (
        <RNAViewer
          {...(rna2dProps || {})}
          geneData={
            rna2dProps?.geneData || {
              id: "",
              name: "",
              chromosome: "",
              start: 0,
              end: 0,
              strand: "",
              sequence: "",
            }
          }
          rnaData={
            rna2dProps?.rnaData || {
              id: "",
              geneId: "",
              name: "",
              nucleotides: [],
              base_pairs: [],
            }
          }
        />
      )}
    </div>
  );
};

export default RNAViewerPanel;
