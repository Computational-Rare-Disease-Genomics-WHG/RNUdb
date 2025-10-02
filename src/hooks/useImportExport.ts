import { useCallback } from 'react';
import type { RNAData } from '../types/rna';

export const useImportExport = () => {
  const exportToJSON = useCallback((rnaData: RNAData) => {
    const exportData = {
      ...rnaData,
      metadata: {
        exportedAt: new Date().toISOString(),
        version: '1.0.0',
        source: 'RNAdb Editor'
      }
    };
    return JSON.stringify(exportData, null, 2);
  }, []);

  const copyToClipboard = useCallback(async (rnaData: RNAData) => {
    try {
      await navigator.clipboard.writeText(exportToJSON(rnaData));
      return true;
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      return false;
    }
  }, [exportToJSON]);

  const downloadJSON = useCallback((rnaData: RNAData, filename?: string) => {
    const dataStr = exportToJSON(rnaData);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = filename || `${rnaData.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  }, [exportToJSON]);

  const importFromJSON = useCallback((jsonString: string): RNAData | null => {
    try {
      const parsed = JSON.parse(jsonString);
      
      // Validate the structure
      if (!parsed.id || !parsed.name || !Array.isArray(parsed.nucleotides) || !Array.isArray(parsed.basePairs)) {
        throw new Error('Invalid RNA data structure');
      }
      
      // Validate nucleotides
      for (const nucleotide of parsed.nucleotides) {
        if (typeof nucleotide.id !== 'number' || 
            typeof nucleotide.x !== 'number' || 
            typeof nucleotide.y !== 'number') {
          throw new Error('Invalid nucleotide structure');
        }
      }
      
      // Validate base pairs
      for (const basePair of parsed.basePairs) {
        if (typeof basePair.from !== 'number' || typeof basePair.to !== 'number') {
          throw new Error('Invalid base pair structure');
        }
      }

      // Validate structural features if present
      if (parsed.structuralFeatures) {
        for (const feature of parsed.structuralFeatures) {
          if (!feature.id || !feature.featureType || !Array.isArray(feature.nucleotideIds)) {
            throw new Error('Invalid structural feature structure');
          }
          if (!feature.label || typeof feature.label.text !== 'string') {
            throw new Error('Invalid structural feature label');
          }
        }
      }

      return {
        id: parsed.id,
        geneId: parsed.geneId || 'imported',
        name: parsed.name,
        nucleotides: parsed.nucleotides,
        basePairs: parsed.basePairs,
        canvasWidth: parsed.canvasWidth,
        canvasHeight: parsed.canvasHeight,
        annotations: parsed.annotations || [],
        structuralFeatures: parsed.structuralFeatures || []
      };
    } catch (error) {
      console.error('Failed to import JSON:', error);
      return null;
    }
  }, []);

  const importFromFile = useCallback((): Promise<RNAData | null> => {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (e) => {
            const content = e.target?.result as string;
            const imported = importFromJSON(content);
            resolve(imported);
          };
          reader.onerror = () => resolve(null);
          reader.readAsText(file);
        } else {
          resolve(null);
        }
      };
      input.click();
    });
  }, [importFromJSON]);

  const saveToLocalStorage = useCallback((rnaData: RNAData, key?: string) => {
    try {
      const storageKey = key || `rna_editor_${rnaData.id}`;
      const dataWithTimestamp = {
        ...rnaData,
        savedAt: new Date().toISOString()
      };
      localStorage.setItem(storageKey, JSON.stringify(dataWithTimestamp));
      return storageKey;
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
      return null;
    }
  }, []);

  const loadFromLocalStorage = useCallback((key: string): RNAData | null => {
    try {
      const data = localStorage.getItem(key);
      if (!data) return null;
      
      const parsed = JSON.parse(data);
      return {
        id: parsed.id,
        geneId: parsed.geneId || 'imported',
        name: parsed.name,
        nucleotides: parsed.nucleotides,
        basePairs: parsed.basePairs,
        canvasWidth: parsed.canvasWidth,
        canvasHeight: parsed.canvasHeight,
        annotations: parsed.annotations || [],
        structuralFeatures: parsed.structuralFeatures || []
      };
    } catch (error) {
      console.error('Failed to load from localStorage:', error);
      return null;
    }
  }, []);

  const listSavedStructures = useCallback((): Array<{ key: string; name: string; savedAt: string }> => {
    const saved = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('rna_editor_')) {
        try {
          const data = JSON.parse(localStorage.getItem(key) || '{}');
          saved.push({
            key,
            name: data.name || 'Untitled',
            savedAt: data.savedAt || 'Unknown'
          });
        } catch (error) {
          // Skip invalid entries
        }
      }
    }
    return saved.sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());
  }, []);

  const deleteSavedStructure = useCallback((key: string) => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Failed to delete saved structure:', error);
      return false;
    }
  }, []);

  return {
    exportToJSON,
    copyToClipboard,
    downloadJSON,
    importFromJSON,
    importFromFile,
    saveToLocalStorage,
    loadFromLocalStorage,
    listSavedStructures,
    deleteSavedStructure
  };
};