import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import MainContent from '../components/MainContent';
import Footer from '../components/Footer';
import { snRNAData, type SnRNAGeneData } from '../data/snRNAData';
import { variantData, gnomadVariants, clinVarOverlayData, gnomadOverlayData, createFunctionScoreOverlayData, createDepletionGroupOverlayData } from '../data/variantData';
import { sgeData, createFunctionScoreOverlayData as createSGEFunctionScoreOverlayData, createDepletionGroupOverlayData as createSGEDepletionGroupOverlayData } from '../data/sgeData';
import type { OverlayData } from '../types';
import { paperData } from '../data/paperData';

const Gene: React.FC = () => {
  const { geneId } = useParams<{ geneId: string }>();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSnRNA, setSelectedSnRNA] = useState(geneId || 'RNU4-2');
  const [searchResults, setSearchResults] = useState<null | SnRNAGeneData[]>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [overlayMode, setOverlayMode] = useState<'none' | 'clinvar' | 'gnomad' | 'function_score' | 'depletion_group'>('none');
  const [functionScoreOverlayData, setFunctionScoreOverlayData] = useState<OverlayData>({});
  const [depletionGroupOverlayData, setDepletionGroupOverlayData] = useState<OverlayData>({});

  useEffect(() => {
    if (geneId && geneId !== selectedSnRNA) {
      if (snRNAData[geneId]) {
        setSelectedSnRNA(geneId);
      } else {
        navigate('/gene/RNU4-2');
      }
    }
  }, [geneId, selectedSnRNA, navigate]);

  useEffect(() => {
    // Create overlay data from both clinical variants and SGE data
    const clinicalFunctionScores = createFunctionScoreOverlayData(variantData);
    const sgeFunctionScores = createSGEFunctionScoreOverlayData(sgeData);
    const combinedFunctionScores = { ...clinicalFunctionScores, ...sgeFunctionScores };
    
    const clinicalDepletionGroups = createDepletionGroupOverlayData(variantData);
    const sgeDepletionGroups = createSGEDepletionGroupOverlayData(sgeData);
    const combinedDepletionGroups = { ...clinicalDepletionGroups, ...sgeDepletionGroups };
    
    setFunctionScoreOverlayData(combinedFunctionScores);
    setDepletionGroupOverlayData(combinedDepletionGroups);
  }, []);

  const cycleOverlayMode = () => {
    setOverlayMode(prev => {
      switch (prev) {
        case 'none': return 'clinvar';
        case 'clinvar': return 'gnomad';
        case 'gnomad': return 'function_score';
        case 'function_score': return 'depletion_group';
        case 'depletion_group': return 'none';
        default: return 'none';
      }
    });
  };

  const getCurrentOverlayData = (): OverlayData => {
    switch (overlayMode) {
      case 'clinvar': return clinVarOverlayData;
      case 'gnomad': return gnomadOverlayData;
      case 'function_score': return functionScoreOverlayData;
      case 'depletion_group': return depletionGroupOverlayData;
      default: return {};
    }
  };

  const currentData = snRNAData[selectedSnRNA] || snRNAData['RNU4-2'];

  const getVariantStats = () => {
    const pathogenic = variantData.filter(v => v.clinical === 'Pathogenic' || v.clinical === 'Likely Pathogenic').length;
    const benign = variantData.filter(v => v.clinical === 'Benign').length;
    const vus = variantData.filter(v => v.clinical === 'VUS').length;
    
    return { pathogenic, benign, vus, total: variantData.length };
  };

  const variantStats = getVariantStats();

  const handleGeneSelect = (geneName: string) => {
    navigate(`/gene/${geneName}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-stone-50 to-neutral-100">
      <Header
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        searchResults={searchResults}
        setSearchResults={setSearchResults}
        setSelectedSnRNA={handleGeneSelect}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />
      
      <MainContent
        currentData={currentData}
        paperData={paperData}
        variantData={variantData}
        gnomadVariants={gnomadVariants}
        overlayMode={overlayMode}
        getCurrentOverlayData={getCurrentOverlayData}
        cycleOverlayMode={cycleOverlayMode}
        variantStats={variantStats}
      />
      
      <Footer />
    </div>
  );
};

export default Gene;