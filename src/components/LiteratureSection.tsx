import React from 'react';
import { BookOpen, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Literature } from '@/types';

interface LiteratureSectionProps {
  paperData: Literature[];
  currentGene: string;
}

const LiteratureSection: React.FC<LiteratureSectionProps> = ({ 
  paperData, 
  currentGene 
}) => {
  return (
    <Card className="bg-white/95 backdrop-blur-sm border border-slate-200 shadow-xl shadow-slate-200/30 rounded-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-teal-600" />
          Literature ({paperData.length})
        </CardTitle>
        <CardDescription>
          Recent publications on {currentGene}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {paperData.map((paper, index) => (
            <div key={index} className="bg-slate-50 p-4 rounded-xl border border-slate-200 hover:shadow-md transition-all duration-300">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-gray-900 leading-tight mb-2">{paper.title}</h4>
                  <p className="text-xs text-gray-600 mb-3">
                    {paper.authors} | {paper.journal} ({paper.year})
                  </p>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs bg-white border-slate-300 text-slate-700 font-mono">
                      PMID: {paper.pmid}
                    </Badge>
                    <Button size="sm" variant="ghost" className="h-6 px-2 hover:bg-teal-50 hover:text-teal-600 transition-colors duration-200">
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default LiteratureSection;