import { useState, useCallback } from 'react';
import type { RNAData, Nucleotide, BasePair, StructuralFeature } from '../types/rna';

export const useNucleotideManager = (initialData: RNAData) => {
  const [rnaData, setRnaData] = useState<RNAData>(initialData);
  const [selectedNucleotides, setSelectedNucleotides] = useState<number[]>([]);
  const [currentNucleotide, setCurrentNucleotide] = useState<number | null>(null);
  const [snapDistance] = useState(40);

  const findSnapPosition = useCallback((x: number, y: number, excludeId?: number) => {
    const snapRadius = 32;
    const snapThreshold = 40;
    
    for (const nucleotide of rnaData.nucleotides) {
      if (nucleotide.id === excludeId) continue;
      
      const dx = x - nucleotide.x;
      const dy = y - nucleotide.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < snapThreshold && distance > 0) {
        const angle = Math.atan2(dy, dx);
        const snapX = nucleotide.x + Math.cos(angle) * snapRadius;
        const snapY = nucleotide.y + Math.sin(angle) * snapRadius;
        return { x: snapX, y: snapY };
      }
    }
    
    return { x, y };
  }, [rnaData.nucleotides]);

  const getSmartSnapPosition = useCallback((x: number, y: number) => {
    // Priority 1: Snap to currently selected nucleotide
    if (currentNucleotide) {
      const selectedNuc = rnaData.nucleotides.find(n => n.id === currentNucleotide);
      if (selectedNuc) {
        return findSnapPosition(selectedNuc.x + 40, selectedNuc.y, currentNucleotide);
      }
    }
    
    // Priority 2: Snap to last added nucleotide
    if (rnaData.nucleotides.length > 0) {
      const lastNuc = rnaData.nucleotides[rnaData.nucleotides.length - 1];
      return findSnapPosition(lastNuc.x + 40, lastNuc.y, lastNuc.id);
    }
    
    // Priority 3: Use provided coordinates with snap
    return findSnapPosition(x - 15, y - 15);
  }, [currentNucleotide, rnaData.nucleotides, findSnapPosition]);

  const addNucleotide = useCallback((x: number, y: number) => {
    const newId = Math.max(...rnaData.nucleotides.map(n => n.id), 0) + 1;
    const snapPos = getSmartSnapPosition(x, y);
    
    const newNucleotide: Nucleotide = {
      id: newId,
      base: null as any,
      x: snapPos.x,
      y: snapPos.y
    };
    
    setRnaData(prev => ({
      ...prev,
      nucleotides: [...prev.nucleotides, newNucleotide]
    }));
    
    setCurrentNucleotide(newId);
    setSelectedNucleotides([newId]);
    return newId;
  }, [rnaData.nucleotides, getSmartSnapPosition, setCurrentNucleotide, setSelectedNucleotides]);

  const removeNucleotide = useCallback((id: number) => {
    setRnaData(prev => ({
      ...prev,
      nucleotides: prev.nucleotides.filter(n => n.id !== id),
      basePairs: prev.basePairs.filter(bp => bp.from !== id && bp.to !== id)
    }));
    setSelectedNucleotides(prev => prev.filter(nId => nId !== id));
    setCurrentNucleotide(null);
  }, []);

  const updateNucleotidePosition = useCallback((id: number, x: number, y: number) => {
    setRnaData(prev => ({
      ...prev,
      nucleotides: prev.nucleotides.map(n => 
        n.id === id ? { ...n, x, y } : n
      )
    }));
  }, []);

  const updateNucleotideBase = useCallback((nucleotideId: number, newBase: 'A' | 'C' | 'G' | 'U') => {
    setRnaData(prev => ({
      ...prev,
      nucleotides: prev.nucleotides.map(n => 
        n.id === nucleotideId ? { ...n, base: newBase } : n
      )
    }));
  }, []);

  const updateNucleotideId = useCallback((oldId: number, newId: number) => {
    if (rnaData.nucleotides.some(n => n.id === newId && n.id !== oldId)) {
      return false; // ID already exists
    }
    
    setRnaData(prev => ({
      ...prev,
      nucleotides: prev.nucleotides.map(n => 
        n.id === oldId ? { ...n, id: newId } : n
      ),
      basePairs: prev.basePairs.map(bp => ({
        from: bp.from === oldId ? newId : bp.from,
        to: bp.to === oldId ? newId : bp.to
      }))
    }));
    
    setCurrentNucleotide(newId);
    setSelectedNucleotides([newId]);
    return true;
  }, [rnaData.nucleotides]);

  const addBasePair = useCallback((nucleotide1: number, nucleotide2: number) => {
    const exists = rnaData.basePairs.some(bp => 
      (bp.from === nucleotide1 && bp.to === nucleotide2) ||
      (bp.from === nucleotide2 && bp.to === nucleotide1)
    );
    
    if (!exists) {
      const newBasePair: BasePair = { from: nucleotide1, to: nucleotide2 };
      setRnaData(prev => ({
        ...prev,
        basePairs: [...prev.basePairs, newBasePair]
      }));
    }
  }, [rnaData.basePairs]);

  const removeBasePair = useCallback((nucleotide1: number, nucleotide2: number) => {
    setRnaData(prev => ({
      ...prev,
      basePairs: prev.basePairs.filter(bp => 
        !((bp.from === nucleotide1 && bp.to === nucleotide2) ||
          (bp.from === nucleotide2 && bp.to === nucleotide1))
      )
    }));
  }, []);

  const navigateNucleotides = useCallback((direction: string) => {
    if (rnaData.nucleotides.length === 0) return;
    
    const currentIndex = currentNucleotide 
      ? rnaData.nucleotides.findIndex(n => n.id === currentNucleotide)
      : -1;
    
    let newIndex = currentIndex;
    
    switch (direction) {
      case 'ArrowUp':
      case 'ArrowLeft':
        newIndex = currentIndex <= 0 ? rnaData.nucleotides.length - 1 : currentIndex - 1;
        break;
      case 'ArrowDown':
      case 'ArrowRight':
        newIndex = currentIndex >= rnaData.nucleotides.length - 1 ? 0 : currentIndex + 1;
        break;
    }
    
    setCurrentNucleotide(rnaData.nucleotides[newIndex].id);
    setSelectedNucleotides([rnaData.nucleotides[newIndex].id]);
  }, [currentNucleotide, rnaData.nucleotides]);

  const updateRnaData = useCallback((newData: RNAData) => {
    setRnaData(newData);
    setCurrentNucleotide(null);
    setSelectedNucleotides([]);
  }, [setCurrentNucleotide, setSelectedNucleotides]);

  // Structural Features Management
  const addStructuralFeature = useCallback((feature: Omit<StructuralFeature, 'id'>) => {
    const newFeature: StructuralFeature = {
      ...feature,
      id: `feature-${Date.now()}`
    };

    setRnaData(prev => ({
      ...prev,
      structuralFeatures: [...(prev.structuralFeatures || []), newFeature]
    }));

    return newFeature.id;
  }, []);

  const updateStructuralFeature = useCallback((featureId: string, updates: Partial<StructuralFeature>) => {
    setRnaData(prev => ({
      ...prev,
      structuralFeatures: prev.structuralFeatures?.map(f =>
        f.id === featureId ? { ...f, ...updates } : f
      )
    }));
  }, []);

  const removeStructuralFeature = useCallback((featureId: string) => {
    setRnaData(prev => ({
      ...prev,
      structuralFeatures: prev.structuralFeatures?.filter(f => f.id !== featureId)
    }));
  }, []);

  return {
    rnaData,
    selectedNucleotides,
    currentNucleotide,
    snapDistance,
    setSelectedNucleotides,
    setCurrentNucleotide,
    updateRnaData,
    findSnapPosition,
    getSmartSnapPosition,
    addNucleotide,
    removeNucleotide,
    updateNucleotidePosition,
    updateNucleotideBase,
    updateNucleotideId,
    addBasePair,
    removeBasePair,
    navigateNucleotides,
    addStructuralFeature,
    updateStructuralFeature,
    removeStructuralFeature
  };
};