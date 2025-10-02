import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { X } from 'lucide-react';
import type { StructuralFeature, FeatureType, Nucleotide } from '../../types/rna';

interface StructuralFeatureModalProps {
  isOpen: boolean;
  selectedNucleotides: number[];
  nucleotides: Nucleotide[];
  initialFeature?: StructuralFeature;
  onSubmit: (feature: Omit<StructuralFeature, 'id'>) => void;
  onCancel: () => void;
}

const FEATURE_TYPES: { value: FeatureType; label: string; color: string }[] = [
  { value: 'k-turn', label: 'K-turn', color: '#8b5cf6' },
  { value: 'hairpin', label: 'Hairpin', color: '#3b82f6' },
  { value: 'loop', label: 'Loop', color: '#10b981' },
  { value: 'stem', label: 'Stem', color: '#f59e0b' },
  { value: 'bulge', label: 'Bulge', color: '#ef4444' },
  { value: 'internal-loop', label: 'Internal Loop', color: '#ec4899' },
  { value: 'multi-branch-loop', label: 'Multi-branch Loop', color: '#06b6d4' },
  { value: 'custom', label: 'Custom', color: '#6b7280' }
];

const FEATURE_COLORS = [
  '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b',
  '#ef4444', '#ec4899', '#06b6d4', '#6b7280'
];

export const StructuralFeatureModal: React.FC<StructuralFeatureModalProps> = ({
  isOpen,
  selectedNucleotides,
  nucleotides,
  initialFeature,
  onSubmit,
  onCancel
}) => {
  const [featureType, setFeatureType] = useState<FeatureType>('hairpin');
  const [labelText, setLabelText] = useState('');
  const [labelX, setLabelX] = useState(0);
  const [labelY, setLabelY] = useState(0);
  const [fontSize, setFontSize] = useState(16);
  const [labelColor, setLabelColor] = useState('#7c3aed');
  const [description, setDescription] = useState('');
  const [featureColor, setFeatureColor] = useState('#8b5cf6');

  // Calculate centroid of selected nucleotides (accounting for +15 nucleotide center offset)
  useEffect(() => {
    if (selectedNucleotides.length > 0 && !initialFeature) {
      const selectedNucs = nucleotides.filter(n => selectedNucleotides.includes(n.id));
      if (selectedNucs.length > 0) {
        const sumX = selectedNucs.reduce((sum, n) => sum + (n.x + 15), 0);
        const sumY = selectedNucs.reduce((sum, n) => sum + (n.y + 15), 0);
        setLabelX(Math.round(sumX / selectedNucs.length));
        setLabelY(Math.round(sumY / selectedNucs.length - 40)); // Slightly above centroid
      }
    }
  }, [selectedNucleotides, nucleotides, initialFeature]);

  // Load initial feature data if editing
  useEffect(() => {
    if (initialFeature) {
      setFeatureType(initialFeature.featureType);
      setLabelText(initialFeature.label.text);
      setLabelX(initialFeature.label.x);
      setLabelY(initialFeature.label.y);
      setFontSize(initialFeature.label.fontSize);
      setLabelColor(initialFeature.label.color || '#7c3aed');
      setDescription(initialFeature.description || '');
      setFeatureColor(initialFeature.color || '#8b5cf6');
    } else {
      // Reset for new feature
      setFeatureType('hairpin');
      setLabelText('');
      setDescription('');
    }
  }, [initialFeature]);

  const handleSubmit = () => {
    if (!labelText.trim()) {
      alert('Please enter a label for the feature');
      return;
    }

    if (selectedNucleotides.length === 0) {
      alert('Please select nucleotides for the feature');
      return;
    }

    const feature: Omit<StructuralFeature, 'id'> = {
      featureType,
      nucleotideIds: selectedNucleotides,
      label: {
        text: labelText.trim(),
        x: labelX,
        y: labelY,
        fontSize,
        color: labelColor
      },
      description: description.trim() || undefined,
      color: featureColor
    };

    onSubmit(feature);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-900">
            {initialFeature ? 'Edit' : 'Add'} Structural Feature
          </h2>
          <button
            onClick={onCancel}
            className="text-slate-400 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Feature Type */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Feature Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              {FEATURE_TYPES.map(type => (
                <button
                  key={type.value}
                  onClick={() => {
                    setFeatureType(type.value);
                    setFeatureColor(type.color);
                    setLabelColor(type.color);
                  }}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    featureType === type.value
                      ? 'bg-teal-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Selected Nucleotides */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Selected Nucleotides ({selectedNucleotides.length})
            </label>
            <div className="bg-slate-50 rounded-md p-3 max-h-24 overflow-y-auto">
              <div className="flex flex-wrap gap-1">
                {selectedNucleotides.sort((a, b) => a - b).map(id => (
                  <span
                    key={id}
                    className="inline-block px-2 py-1 bg-teal-100 text-teal-800 text-xs font-medium rounded"
                  >
                    {id}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Label Text */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Label Text *
            </label>
            <Input
              type="text"
              value={labelText}
              onChange={(e) => setLabelText(e.target.value)}
              onKeyDown={(e) => e.stopPropagation()}
              placeholder="e.g., K-turn I, Stem-loop IIa"
              className="w-full"
            />
          </div>

          {/* Label Position */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-slate-700">
                Label Position
              </label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const selectedNucs = nucleotides.filter(n => selectedNucleotides.includes(n.id));
                  if (selectedNucs.length > 0) {
                    const sumX = selectedNucs.reduce((sum, n) => sum + (n.x + 15), 0);
                    const sumY = selectedNucs.reduce((sum, n) => sum + (n.y + 15), 0);
                    setLabelX(Math.round(sumX / selectedNucs.length));
                    setLabelY(Math.round(sumY / selectedNucs.length - 40));
                  }
                }}
                className="text-xs"
              >
                Re-center Label
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Input
                  type="number"
                  value={labelX}
                  onChange={(e) => setLabelX(Number(e.target.value))}
                  onKeyDown={(e) => e.stopPropagation()}
                  placeholder="X"
                  className="w-full"
                />
              </div>
              <div>
                <Input
                  type="number"
                  value={labelY}
                  onChange={(e) => setLabelY(Number(e.target.value))}
                  onKeyDown={(e) => e.stopPropagation()}
                  placeholder="Y"
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Font Size */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Font Size
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="8"
                max="50"
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="w-16 text-center bg-slate-100 rounded py-1">
                <span className="text-xs font-medium text-slate-600">{fontSize}px</span>
              </div>
            </div>
          </div>

          {/* Colors */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Label Color
              </label>
              <div className="flex gap-2">
                {FEATURE_COLORS.map(color => (
                  <button
                    key={color}
                    onClick={() => setLabelColor(color)}
                    className={`w-8 h-8 rounded-full border-2 ${
                      labelColor === color ? 'border-slate-900' : 'border-slate-300'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Feature Color
              </label>
              <div className="flex gap-2">
                {FEATURE_COLORS.map(color => (
                  <button
                    key={color}
                    onClick={() => setFeatureColor(color)}
                    className={`w-8 h-8 rounded-full border-2 ${
                      featureColor === color ? 'border-slate-900' : 'border-slate-300'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onKeyDown={(e) => e.stopPropagation()}
              placeholder="e.g., Conserved structural motif important for protein binding"
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
              rows={3}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} className="bg-teal-600 hover:bg-teal-700">
            {initialFeature ? 'Update' : 'Add'} Feature
          </Button>
        </div>
      </div>
    </div>
  );
};
