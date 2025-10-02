import React from 'react';
import { Database, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { COLORBLIND_FRIENDLY_PALETTE } from '../lib/colors';
import type { Variant } from '@/types';

interface VariantsSectionProps {
  variantData: Variant[];
  currentGene: string;
  variantStats: {
    pathogenic: number;
    benign: number;
    vus: number;
    total: number;
  };
}

const VariantsSection: React.FC<VariantsSectionProps> = ({ 
  variantData, 
  currentGene, 
  variantStats 
}) => {
  const getConsequenceBadge = (consequence: string) => {
    // Colorblind-friendly consequence colors
    const colorMap: { [key: string]: string } = {
      'synonymous_variant': 'bg-emerald-100 text-emerald-800 border-emerald-200',
      'structural_variant': 'bg-red-100 text-red-800 border-red-200',
      'regulatory_variant': 'bg-amber-100 text-amber-800 border-amber-200',
      'splice_site_variant': 'bg-purple-100 text-purple-800 border-purple-200'
    };
    return colorMap[consequence] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getClinicalBadge = (clinical: string) => {
    // Colorblind-friendly clinical significance colors
    const colorMap = {
      'Benign': 'bg-emerald-100 text-emerald-800 border-emerald-200',
      'Pathogenic': 'bg-red-100 text-red-800 border-red-200',
      'Likely Pathogenic': 'bg-red-100 text-red-700 border-red-200',
      'Likely Benign': 'bg-emerald-100 text-emerald-700 border-emerald-200',
      'VUS': 'bg-amber-100 text-amber-800 border-amber-200'
    };
    return colorMap[clinical as keyof typeof colorMap] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  return (
    <Card className="bg-white/95 backdrop-blur-sm border border-slate-200 shadow-xl shadow-slate-200/30 rounded-2xl h-full" id="variants">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-6 w-6 text-teal-600" />
                ClinVar Variants ({variantData.length} variants)
              </CardTitle>
              <CardDescription>
                Clinical variants in {currentGene} with gnomAD and ClinVar annotations
              </CardDescription>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORBLIND_FRIENDLY_PALETTE.CLINVAR.PATHOGENIC }}></div>
                <span>{variantStats.pathogenic} Pathogenic</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORBLIND_FRIENDLY_PALETTE.CLINVAR.BENIGN }}></div>
                <span>{variantStats.benign} Benign</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORBLIND_FRIENDLY_PALETTE.CLINVAR.VUS }}></div>
                <span>{variantStats.vus} VUS</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="grid gap-3 max-h-96 overflow-y-auto">
              {variantData.map((variant) => (
                <div key={variant.id} className="bg-slate-50 p-4 rounded-xl border border-slate-200 hover:shadow-md transition-all duration-300">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 flex-wrap mb-2">
                        <Badge variant="outline" className="font-mono text-xs bg-white border-slate-300 text-slate-700">
                          {variant.id}
                        </Badge>
                        <span className="text-xs text-gray-600 font-mono">{variant.position}</span>
                        <Badge className="font-mono text-xs bg-slate-200 text-slate-800 border-slate-300">
                          {variant.ref}→{variant.alt}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={`text-xs ${getConsequenceBadge(variant.consequence ?? '')}`}>
                          {variant.consequence?.replace('_', ' ') ?? 'Unknown'}
                        </Badge>
                        <Badge className={`text-xs ${getClinicalBadge(variant.clinical_significance ?? '')}`}>
                          {variant.clinical_significance}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-right">
                      <div className="text-xs text-gray-600">
                        <div><span className="font-medium">MAF:</span> {variant.gnomad_ac ?? 'N/A'}</div>
                        <div><span className="font-medium">gnomAD:</span> {variant.gnomad_ac ?? 'N/A'}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="text-xs bg-blue-100 text-blue-800 border-blue-200 font-medium">
                          {variant.clinvar_significance}
                        </Badge>
                        <Button size="sm" variant="outline" className="h-7 px-2 hover:bg-blue-50 hover:border-blue-300 transition-colors duration-200">
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
  );
};

export default VariantsSection;