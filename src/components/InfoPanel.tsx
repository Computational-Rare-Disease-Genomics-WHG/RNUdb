import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Database, Dna, Globe, Search } from 'lucide-react';
import type { SnRNAGeneData } from '../data/snRNAData';
import type { Paper } from '../data/paperData';
import type { Variant } from '../data/variantData';

interface InfoPanelProps {
  currentData: SnRNAGeneData;
  paperData: Paper[];
  variantData: Variant[];
  overlayMode: 'none' | 'clinvar' | 'gnomad' | 'function_score' | 'depletion_group';
  onCycleOverlay: () => void;
}

const InfoPanel: React.FC<InfoPanelProps> = ({ 
  currentData, 
  variantData: _variantData,
}) => {


  return (
    <div className="space-y-6">
      
      {/* Gene Information */}
      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-teal-600 rounded-lg">
                <Dna className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-gray-900">
                  {currentData.name}
                </CardTitle>
                <CardDescription className="text-sm text-gray-600 mt-1">
                  {currentData.fullName}
                </CardDescription>
              </div>
            </div>
            <Badge className="bg-teal-50 text-teal-700 border-teal-200 px-3 py-1 text-sm font-medium">
              {currentData.type}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-700 leading-relaxed">{currentData.description}</p>
          
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
            <div className="text-center">
              <div className="text-sm text-gray-500">Chromosome</div>
              <div className="text-lg font-semibold text-gray-900">{currentData.chromosome}</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-500">Position</div>
              <div className="text-xs font-mono text-gray-900">{currentData.position}</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-500">Length</div>
              <div className="text-lg font-semibold text-gray-900">{currentData.length}</div>
            </div>
          </div>
          
          {/* Additional Information */}
          <div className="pt-4 border-t border-gray-100 space-y-3">
            <div className="text-sm">
              <span className="font-medium text-gray-700">Ensembl ID:</span>
              <span className="ml-2 font-mono text-gray-900">ENSG00000206652</span>
            </div>
            
            {/* External Links */}
            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-700">External Resources:</div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" className="h-8 px-3 text-xs">
                  <Globe className="h-3 w-3 mr-1" />
                  gnomAD
                </Button>
                <Button size="sm" variant="outline" className="h-8 px-3 text-xs">
                  <Search className="h-3 w-3 mr-1" />
                  UCSC
                </Button>
                <Button size="sm" variant="outline" className="h-8 px-3 text-xs">
                  <Database className="h-3 w-3 mr-1" />
                  OMIM
                </Button>
                <Button size="sm" variant="outline" className="h-8 px-3 text-xs">
                  <Dna className="h-3 w-3 mr-1" />
                  Ensembl
                </Button>
              </div>
            </div>
            
          </div>
        </CardContent>
      </Card>


    </div>
  );
};

export default InfoPanel;