import React from 'react';
import { Link } from 'react-router-dom';
import { Dna, Download, Upload } from 'lucide-react';
import { Button } from '../ui/button';

interface EditorHeaderProps {
  onExport?: () => void;
  onImport?: () => void;
}

const EditorHeader: React.FC<EditorHeaderProps> = ({
  onExport,
  onImport
}) => {
  return (
    <header className="bg-white/95 backdrop-blur-xl border-b border-slate-200 sticky top-0 z-50 shadow-lg shadow-slate-200/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center space-x-4">
            <Link to="/" className="flex items-center space-x-2">
              <div className="p-3 bg-teal-600 rounded-xl shadow-lg">
                <Dna className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-teal-600 tracking-tight">
                  RNU<span className="text-teal-600">db</span>
                </h1>
              </div>
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-4">
            <Button 
              variant="outline" 
              onClick={onImport}
              className="h-10 px-4 border-slate-300 hover:bg-slate-50 rounded-xl"
            >
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
            
            <Button 
              onClick={onExport}
              className="h-10 px-6 bg-teal-600 hover:bg-teal-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            
            <div className="text-xs text-slate-500 bg-slate-100 px-3 py-2 rounded-lg">
              Auto-saved
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default EditorHeader;