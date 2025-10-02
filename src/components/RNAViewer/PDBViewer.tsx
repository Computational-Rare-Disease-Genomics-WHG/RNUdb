import React, { useEffect, useRef, useState, useCallback } from "react";
import type { PDBStructure, Nucleotide, OverlayData, Variant } from "@/types";
import { COLORBLIND_FRIENDLY_PALETTE, generateGnomadColorWithAlpha, getFunctionScoreColor } from '../../lib/colors';
import { getOverlayValue } from '../../lib/overlayUtils';
// NGL is loaded via CDN for simplicity. For production, use npm install and import.
const NGL_URL = "https://unpkg.com/ngl@2.0.0-dev.40/dist/ngl.js";

interface PDBViewerProps {
  pdbData: PDBStructure | null;
  width?: string;
  height?: string;
  overlayData?: OverlayData;
  overlayMode?: 'none' | 'clinvar' | 'gnomad' | 'function_score' | 'depletion_group';
  selectedNucleotide?: Nucleotide | null;
  onNucleotideClick?: (nucleotide: Nucleotide) => void;
  onNucleotideHover?: (nucleotide: Nucleotide | null) => void;
  variantData?: Variant[];
  gnomadVariants?: Variant[];
}



const PDBViewer: React.FC<PDBViewerProps> = ({
  pdbData,
  width = "100%",
  height = "400px",
  overlayData = {},
  overlayMode = 'none',
  selectedNucleotide = null,
  onNucleotideClick,
  onNucleotideHover,
  variantData = [],
  gnomadVariants = []
}) => {
  const stageRef = useRef<HTMLDivElement>(null);
  const nglLoaded = useRef(false);
  const nglStageRef = useRef<any>(null); // Store NGL stage for cleanup
  const nglComponentRef = useRef<any>(null); // Store NGL component for updates
  const isDisposing = useRef(false); // Flag to prevent operations during disposal
  const rnaChainInfoRef = useRef<Map<string, { minRes: number; maxRes: number; count: number }> | null>(null); // Cache chain info
  const [hoveredNucleotide, setHoveredNucleotide] = useState<Nucleotide | null>(null);

  // Color mapping function for overlays
  const getOverlayColor = useCallback((nucleotideId: number): string => {
    const value = getOverlayValue(overlayData, nucleotideId);
    if (!value) return COLORBLIND_FRIENDLY_PALETTE.NEUTRAL.BACKGROUND;

    if (overlayMode === 'clinvar') {
      if (value === 1) return COLORBLIND_FRIENDLY_PALETTE.CLINVAR.PATHOGENIC;
      if (value === 0.5) return COLORBLIND_FRIENDLY_PALETTE.CLINVAR.BENIGN;
      if (value === 0.25) return COLORBLIND_FRIENDLY_PALETTE.CLINVAR.VUS;
      return COLORBLIND_FRIENDLY_PALETTE.NEUTRAL.BACKGROUND;
    } else if (overlayMode === 'gnomad') {
      return generateGnomadColorWithAlpha(value);
    } else if (overlayMode === 'function_score') {
      return getFunctionScoreColor(value);
    } else if (overlayMode === 'depletion_group') {
      if (value === 3) return COLORBLIND_FRIENDLY_PALETTE.DEPLETION.STRONG;
      if (value === 2) return COLORBLIND_FRIENDLY_PALETTE.DEPLETION.MODERATE;
      if (value === 1) return COLORBLIND_FRIENDLY_PALETTE.DEPLETION.NORMAL;
      return COLORBLIND_FRIENDLY_PALETTE.NEUTRAL.BACKGROUND;
    }

    return COLORBLIND_FRIENDLY_PALETTE.NEUTRAL.BACKGROUND;
  }, [overlayData, overlayMode]);

  // Handle nucleotide interactions
  const handleNucleotideHover = useCallback((nucleotide: Nucleotide | null) => {
    setHoveredNucleotide(nucleotide);
    onNucleotideHover?.(nucleotide);
  }, [onNucleotideHover]);

  // Load NGL library once
  useEffect(() => {
    if (!nglLoaded.current && !(window as any).NGL) {
      const script = document.createElement("script");
      script.src = NGL_URL;
      script.async = true;
      script.onload = () => {
        nglLoaded.current = true;
      };
      document.body.appendChild(script);
    }
  }, []);

  // Load structure once when pdbData changes
  useEffect(() => {
    if (!stageRef.current || !pdbData) return;

    if (!(window as any).NGL) {
      // Wait for NGL to load
      const checkNGL = setInterval(() => {
        if ((window as any).NGL) {
          clearInterval(checkNGL);
          loadStructure();
        }
      }, 100);
      return () => clearInterval(checkNGL);
    } else {
      loadStructure();
    }
    // eslint-disable-next-line
  }, [pdbData]);

  // Cleanup only on unmount
  useEffect(() => {
    return () => {
      console.log("PDBViewer unmounting - starting cleanup");
      isDisposing.current = true;

      if (nglStageRef.current) {
        try {
          // Remove all components first
          if (nglComponentRef.current) {
            try {
              nglStageRef.current.removeAllComponents();
            } catch (e) {
              console.warn("Error removing components:", e);
            }
          }

          // Dispose the stage
          if (typeof nglStageRef.current.dispose === 'function') {
            nglStageRef.current.dispose();
          }
        } catch (e) {
          console.warn("Error disposing NGL stage:", e);
        } finally {
          nglStageRef.current = null;
          nglComponentRef.current = null;
          rnaChainInfoRef.current = null;
          isDisposing.current = false;
        }
      }
      console.log("PDBViewer cleanup complete");
    };
  }, []);

  // Update colors when overlay data or mode changes (without reloading structure)
  useEffect(() => {
    if (!nglComponentRef.current || !nglStageRef.current) {
      console.log("Skipping color update - component not ready");
      return;
    }
    console.log("Updating colors for overlay mode:", overlayMode);
    updateColors();
    // eslint-disable-next-line
  }, [overlayData, overlayMode, getOverlayColor]);

  function updateColors() {
    // Check if we're in the process of disposing
    if (isDisposing.current) {
      console.log("Skipping updateColors - component is disposing");
      return;
    }

    if (!nglComponentRef.current || !nglStageRef.current) {
      console.warn("updateColors called but refs not available");
      return;
    }

    const NGL = (window as any).NGL;
    if (!NGL) {
      console.warn("NGL not loaded");
      return;
    }

    console.log("Starting color update...");

    try {
      // Remove all existing representations safely
      try {
        const repCount = nglComponentRef.current.reprList?.length || 0;
        console.log(`Removing ${repCount} existing representations`);
        nglComponentRef.current.removeAllRepresentations();
      } catch (e) {
        console.error("Error removing representations:", e);
        return; // Don't try to recover, just skip this update
      }

      // Use cached RNA chain info if available, otherwise detect
      let rnaChains = rnaChainInfoRef.current;
      if (!rnaChains) {
        console.log("Detecting RNA chains (first time)...");
        rnaChains = new Map();
        nglComponentRef.current.structure.eachResidue((residue: any) => {
          if (residue.isNucleic()) {
            const chainName = residue.chainname;
            if (!rnaChains!.has(chainName)) {
              rnaChains!.set(chainName, { minRes: residue.resno, maxRes: residue.resno, count: 0 });
            }
            const chainInfo = rnaChains!.get(chainName)!;
            chainInfo.minRes = Math.min(chainInfo.minRes, residue.resno);
            chainInfo.maxRes = Math.max(chainInfo.maxRes, residue.resno);
            chainInfo.count++;
          }
        });
        rnaChainInfoRef.current = rnaChains; // Cache for next time
      }

      // Find primary chain
      let primaryChain = 'B';
      let maxCount = 0;
      for (const [chain, info] of rnaChains.entries()) {
        if (info.count > maxCount) {
          maxCount = info.count;
          primaryChain = chain;
        }
      }

      // Create color scheme
      let colorScheme = "chainid";

      if (overlayMode !== 'none' && Object.keys(overlayData).length > 0) {
        const chainInfo = rnaChains.get(primaryChain);
        const overlayColorScheme = function(this: any, params: any) {
          this.atomColor = (atom: any) => {
            if (atom.residue && atom.residue.resno && atom.chainname) {
              if (atom.chainname === primaryChain) {
                const pdbResidueNumber = atom.residue.resno;
                let nucleotideId = pdbResidueNumber;
                if (chainInfo && chainInfo.minRes > 1) {
                  nucleotideId = pdbResidueNumber - chainInfo.minRes + 1;
                }
                const color = getOverlayColor(nucleotideId);
                const hex = color.replace('#', '');
                return parseInt(hex, 16);
              } else {
                if (rnaChains.has(atom.chainname)) {
                  const chainIndex = Array.from(rnaChains.keys()).indexOf(atom.chainname);
                  const chainColors = [0x4a90e2, 0xe24a90, 0x90e24a, 0xe2904a];
                  return chainColors[chainIndex % chainColors.length];
                }
                return 0xcccccc;
              }
            }
            return 0xcccccc;
          };
        };

        try {
          // addScheme returns a scheme ID, not a name - use that directly
          const schemeId = NGL.ColormakerRegistry.addScheme(overlayColorScheme);
          colorScheme = schemeId;
        } catch (e) {
          console.warn("Could not create custom overlay color scheme:", e);
          colorScheme = "chainid";
        }
      }

      // Re-add representations with the color scheme ID
      // 1. Cartoon for RNA backbone
      nglComponentRef.current.addRepresentation("cartoon", {
        color: colorScheme,
        radiusScale: 0.8,
        aspectRatio: 3.0,
        opacity: 0.9,
        sele: "nucleic"
      });

      // 2. Licorice for the nucleotide bases
      nglComponentRef.current.addRepresentation("licorice", {
        color: colorScheme,
        sele: "nucleic",
        radiusScale: 0.5,
        multipleBond: "symmetric"
      });

      // Force stage to update
      if (nglStageRef.current && typeof nglStageRef.current.viewer === 'object') {
        nglStageRef.current.viewer.requestRender();
      }

      console.log("Color update completed successfully");
    } catch (error) {
      console.error("Error updating colors:", error);
      // Try to recover by reloading the structure
      if (stageRef.current && pdbData) {
        console.log("Attempting to reload structure after error");
        setTimeout(() => loadStructure(), 100);
      }
    }
  }

  function loadStructure() {
    if (!stageRef.current || !(window as any).NGL) return;
    if (!pdbData || !pdbData.pdbData) {
      if (stageRef.current) {
        stageRef.current.innerHTML = `<div style='color:red;padding:1em;'>No PDB data provided.</div>`;
      }
      return;
    }

    type NGLComponentType = {
      addRepresentation: (type: string, params: object) => {
        setColor: (colorScheme: any) => void;
      };
      autoView: () => void;
      structure: {
        eachResidue: (callback: (residue: any) => void) => void;
      };
    };

    type NGLStageType = {
      loadFile: (file: Blob, params: { ext: string }) => Promise<NGLComponentType>;
      setParameters: (params: { backgroundColor?: string; lightPreset?: string }) => void;
      mouseControls: {
        add: (action: string, callback: (stage: any, pickingProxy: any) => void) => void;
      };
    };

    type NGLType = {
      Stage: new (element: HTMLElement) => NGLStageType;
      ColormakerRegistry: {
        addScheme: (scheme: any, label: string) => void;
      };
    };

    const NGL = (window as unknown as { NGL: NGLType }).NGL;

    // Dispose existing stage if present
    if (nglStageRef.current) {
      try {
        // Remove components first
        if (nglComponentRef.current) {
          try {
            nglStageRef.current.removeAllComponents();
          } catch (e) {
            console.warn("Error removing components:", e);
          }
        }

        // Dispose stage
        if (typeof nglStageRef.current.dispose === 'function') {
          nglStageRef.current.dispose();
        }
      } catch (e) {
        console.warn("Error disposing existing stage:", e);
      } finally {
        nglStageRef.current = null;
        nglComponentRef.current = null;
      }
    }

    stageRef.current.innerHTML = "";
    const stage = new NGL.Stage(stageRef.current);
    nglStageRef.current = stage; // Store reference for cleanup
    const blob = new Blob([pdbData.pdbData], { type: "text/plain" });

    stage.setParameters({
      backgroundColor: "white",
      lightPreset: "day"
    });

    stage.loadFile(blob, { ext: "pdb" }).then((component: NGLComponentType) => {
      nglComponentRef.current = component; // Store component reference
      console.log("PDB structure loaded", component.structure);

      // Detect RNA chains and their properties in ONE pass
      const rnaChains: Map<string, { minRes: number; maxRes: number; count: number }> = new Map();
      const chainSamples: { [key: string]: any[] } = {};

      component.structure.eachResidue((residue: any) => {
        if (residue.isNucleic()) {
          const chainName = residue.chainname;

          // Update chain info
          if (!rnaChains.has(chainName)) {
            rnaChains.set(chainName, { minRes: residue.resno, maxRes: residue.resno, count: 0 });
            chainSamples[chainName] = [];
          }
          const chainInfo = rnaChains.get(chainName)!;
          chainInfo.minRes = Math.min(chainInfo.minRes, residue.resno);
          chainInfo.maxRes = Math.max(chainInfo.maxRes, residue.resno);
          chainInfo.count++;

          // Collect samples
          if (chainSamples[chainName].length < 5) {
            chainSamples[chainName].push({
              resno: residue.resno,
              resname: residue.resname,
              chainname: residue.chainname
            });
          }
        }
      });

      // Cache the chain info for future use
      rnaChainInfoRef.current = rnaChains;

      console.log("RNA/DNA chains found:", Array.from(rnaChains.keys()));
      console.log("Sample residues by chain:", chainSamples);

      console.log("RNA chain analysis:", Array.from(rnaChains.entries()));

      // Find the primary chain (likely the one we want to overlay)
      // Usually the longest chain or the one with residue numbering that matches our data
      let primaryChain = 'B'; // Default fallback
      let maxCount = 0;
      for (const [chain, info] of rnaChains.entries()) {
        if (info.count > maxCount) {
          maxCount = info.count;
          primaryChain = chain;
        }
      }
      console.log("Primary RNA chain detected:", primaryChain);

      // Create custom color scheme for overlays if overlay mode is active
      let colorScheme = "chainid";

      if (overlayMode !== 'none' && Object.keys(overlayData).length > 0) {
        const chainInfo = rnaChains.get(primaryChain);
        const overlayColorScheme = function(this: any, params: any) {
          this.atomColor = (atom: any) => {
            if (atom.residue && atom.residue.resno && atom.chainname) {
              // Apply overlay colors to the primary RNA chain
              if (atom.chainname === primaryChain) {
                const pdbResidueNumber = atom.residue.resno;
                // Try direct mapping first
                let nucleotideId = pdbResidueNumber;

                // If we have chain info, try offset mapping
                if (chainInfo && chainInfo.minRes > 1) {
                  // Offset mapping: if PDB starts at residue N, map to position 1-based
                  nucleotideId = pdbResidueNumber - chainInfo.minRes + 1;
                }

                const color = getOverlayColor(nucleotideId);
                const hex = color.replace('#', '');
                return parseInt(hex, 16);
              } else {
                // For other chains, use distinctive colors
                if (rnaChains.has(atom.chainname)) {
                  // Other RNA chains - use different colors
                  const chainIndex = Array.from(rnaChains.keys()).indexOf(atom.chainname);
                  const chainColors = [0x4a90e2, 0xe24a90, 0x90e24a, 0xe2904a];
                  return chainColors[chainIndex % chainColors.length];
                }
                return 0xcccccc; // Gray for non-RNA chains
              }
            }
            return 0xcccccc;
          };
        };

        try {
          // addScheme returns a scheme ID - use that directly
          const schemeId = NGL.ColormakerRegistry.addScheme(overlayColorScheme);
          colorScheme = schemeId;
          console.log("Custom overlay color scheme registered successfully");
          console.log("Overlay data keys:", Object.keys(overlayData).slice(0, 10));
          console.log("Overlay mode:", overlayMode);
        } catch (e) {
          console.warn("Could not create custom overlay color scheme:", e);
          colorScheme = "chainid";
        }
      }

      // Add multiple representations for better RNA visualization
      try {
        // 1. Cartoon for RNA backbone
        component.addRepresentation("cartoon", {
          color: colorScheme,
          radiusScale: 0.8,
          aspectRatio: 3.0,
          opacity: 0.9,
          sele: "nucleic"
        });

        // 2. Licorice for the nucleotide bases - shows individual atoms
        component.addRepresentation("licorice", {
          color: colorScheme,
          sele: "nucleic",
          radiusScale: 0.5,
          multipleBond: "symmetric"
        });

        console.log("Added cartoon + licorice representations");
      } catch (error) {
        console.warn("Advanced representations failed, using basic cartoon", error);
        // Fallback to basic cartoon representation
        component.addRepresentation("cartoon", {
          color: colorScheme
        });
      }

      // Add click and hover event handlers
      stage.mouseControls.add("clickPick-left", (stage: any, pickingProxy: any) => {
        if (pickingProxy && pickingProxy.atom) {
          const atom = pickingProxy.atom;
          if (atom.residue && atom.residue.resno) {
            // Create a mock nucleotide object for compatibility
            const nucleotide: Nucleotide = {
              id: atom.residue.resno,
              x: atom.x || 0,
              y: atom.y || 0,
              base: atom.residue.resname || 'N'
            };
            onNucleotideClick?.(nucleotide);
          }
        }
      });

      stage.mouseControls.add("hoverPick", (stage: any, pickingProxy: any) => {
        if (pickingProxy && pickingProxy.atom) {
          const atom = pickingProxy.atom;
          if (atom.residue && atom.residue.resno) {
            const nucleotide: Nucleotide = {
              id: atom.residue.resno,
              x: atom.x || 0,
              y: atom.y || 0,
              base: atom.residue.resname || 'N'
            };
            handleNucleotideHover(nucleotide);
          }
        } else {
          handleNucleotideHover(null);
        }
      });

      component.autoView();
    }).catch((err: Error) => {
      if (stageRef.current) {
        stageRef.current.innerHTML = `<div style='color:red;padding:1em;'>${err.message}</div>`;
      }
      console.error(err);
    });
  }

  return <div ref={stageRef} style={{ width, height, background: "#222" }} />;
};

export default PDBViewer;
