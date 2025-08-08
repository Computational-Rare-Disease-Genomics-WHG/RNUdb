import React from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Copy, Download } from 'lucide-react';
import type { RNAData } from '../../types/rna';

interface ExportPanelProps {
  rnaData: RNAData;
}

const ExportPanel: React.FC<ExportPanelProps> = ({ rnaData }) => {
  const exportToJSON = () => {
    return JSON.stringify(rnaData, null, 2);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(exportToJSON());
  };

  const downloadJSON = () => {
    const dataStr = exportToJSON();
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = 'rna-structure.json';
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Export</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          onClick={copyToClipboard}
          className="w-full"
          variant="outline"
        >
          <Copy className="h-4 w-4 mr-2" />
          Copy JSON
        </Button>
        <Button
          onClick={downloadJSON}
          className="w-full"
        >
          <Download className="h-4 w-4 mr-2" />
          Download JSON
        </Button>
      </CardContent>
    </Card>
  );
};

export default ExportPanel;