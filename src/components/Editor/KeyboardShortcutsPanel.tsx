import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Keyboard } from 'lucide-react';

const KeyboardShortcutsPanel: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Keyboard className="h-5 w-5" />
          Keyboard Shortcuts
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div><kbd className="px-2 py-1 bg-gray-100 rounded">N</kbd> - Create new nucleotide</div>
        <div><kbd className="px-2 py-1 bg-gray-100 rounded">A/C/G/U</kbd> - Set base of current nucleotide</div>
        <div><kbd className="px-2 py-1 bg-gray-100 rounded">←/→/↑/↓</kbd> - Navigate nucleotides</div>
        <div><kbd className="px-2 py-1 bg-gray-100 rounded">Del</kbd> - Delete current nucleotide</div>
        <div><kbd className="px-2 py-1 bg-gray-100 rounded">Esc</kbd> - Clear selection</div>
      </CardContent>
    </Card>
  );
};

export default KeyboardShortcutsPanel;