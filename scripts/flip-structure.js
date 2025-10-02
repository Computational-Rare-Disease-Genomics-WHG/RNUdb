#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Read the structure file
const inputPath = path.join(__dirname, '../data/rnu4-2/structure.json');
const outputPath = path.join(__dirname, '../data/rnu4-2/structure-flipped.json');

console.log('Reading structure from:', inputPath);
const structure = JSON.parse(fs.readFileSync(inputPath, 'utf8'));

// Find the center X coordinate
const xCoords = structure.nucleotides.map(n => n.x);
const minX = Math.min(...xCoords);
const maxX = Math.max(...xCoords);
const centerX = (minX + maxX) / 2;

console.log(`X range: ${minX} to ${maxX}`);
console.log(`Center X: ${centerX}`);

// Flip all nucleotide x coordinates
structure.nucleotides = structure.nucleotides.map(nucleotide => ({
  ...nucleotide,
  x: 2 * centerX - nucleotide.x
}));

// Flip annotation x coordinates (labels)
structure.annotations = structure.annotations.map(annotation => ({
  ...annotation,
  x: 2 * centerX - annotation.x
}));

// Write the flipped structure
fs.writeFileSync(outputPath, JSON.stringify(structure, null, 2));
console.log('Flipped structure written to:', outputPath);
