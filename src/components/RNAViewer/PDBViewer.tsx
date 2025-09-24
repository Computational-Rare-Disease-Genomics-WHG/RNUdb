import React, { useEffect, useRef } from "react";
import type { PDBStructure } from "@/types";
// NGL is loaded via CDN for simplicity. For production, use npm install and import.
const NGL_URL = "https://unpkg.com/ngl@2.0.0-dev.40/dist/ngl.js";

interface PDBViewerProps {
  pdbData: PDBStructure | null;
  width?: string;
  height?: string;
}



const PDBViewer: React.FC<PDBViewerProps> = ({ pdbData, width = "100%", height = "400px" }) => {
  const stageRef = useRef<HTMLDivElement>(null);
  const nglLoaded = useRef(false);

  useEffect(() => {
    if (!stageRef.current) return;
    // Dynamically load NGL if not already loaded
    if (!nglLoaded.current && !(window as any).NGL) {
      const script = document.createElement("script");
      script.src = NGL_URL;
      script.async = true;
      script.onload = () => {
        nglLoaded.current = true;
        loadStructure();
      };
      document.body.appendChild(script);
    } else {
      loadStructure();
    }
    // eslint-disable-next-line
  }, []);

  function loadStructure() {
    if (!stageRef.current || !(window as any).NGL) return;
    if (!pdbData || !pdbData.pdbData) {
      if (stageRef.current) {
        stageRef.current.innerHTML = `<div style='color:red;padding:1em;'>No PDB data provided.</div>`;
      }
      return;
    }
  type NGLStageType = {
    loadFile: (file: Blob, params: { ext: string }) => Promise<{
      addRepresentation: (type: string, params: object) => void;
      autoView: () => void;
    }>;
    setParameters: (params: { backgroundColor?: string; lightPreset?: string }) => void;
  };
  type NGLType = {
    Stage: new (element: HTMLElement) => NGLStageType;
  };
  const NGL = (window as unknown as { NGL: NGLType }).NGL;
  stageRef.current.innerHTML = "";
  const stage = new NGL.Stage(stageRef.current);
  const blob = new Blob([pdbData.pdbData], { type: "text/plain" });

  stage.setParameters({
    backgroundColor: "white",
    lightPreset: "day"
  });
  stage.loadFile(blob, { ext: "pdb" }).then((component: {
    addRepresentation: (type: string, params: object) => void;
    autoView: () => void;
  }) => {
    component.addRepresentation("cartoon", { color: "chainid" });
    component.autoView();
  }).catch((err: Error) => {
    if (stageRef.current) {
      stageRef.current.innerHTML = `<div style='color:red;padding:1em;'>${err.message}</div>`;
    }
    // eslint-disable-next-line no-console
    console.error(err);
  });
  }

  return <div ref={stageRef} style={{ width, height, background: "#222" }} />;
};

export default PDBViewer;
