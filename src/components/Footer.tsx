import React from 'react';
import { Dna, Mail, Github, Globe } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-slate-200 mt-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-teal-600 rounded-lg">
              <Dna className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-base font-bold text-teal-600">RNUdb</span>
          </div>
          
          <div className="flex items-center gap-4">
            <a href="mailto:contact@rarediseasegenomics.org" className="text-muted-foreground hover:text-teal-600 transition-colors">
              <Mail className="h-3.5 w-3.5" />
            </a>
            <a href="https://github.com/rarediseasegenomics" className="text-muted-foreground hover:text-teal-600 transition-colors">
              <Github className="h-3.5 w-3.5" />
            </a>
            <a href="https://rarediseasegenomics.org" className="text-muted-foreground hover:text-teal-600 transition-colors">
              <Globe className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
        
        <div className="border-t border-slate-200 mt-3 pt-3 text-center">
<p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Computational Rare Disease Genomics. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
