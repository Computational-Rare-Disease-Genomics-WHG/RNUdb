# RNAdb - RNA Structure Database and Editor

A comprehensive web application for RNA structure visualization, analysis, and editing. Built with React, TypeScript, and modern web technologies.

## Features

### 🧬 RNA Structure Visualization
- Interactive RNA structure viewer with zoom and pan capabilities
- Support for nucleotide base pairs and structural annotations
- Colorblind-friendly visualization with customizable overlays
- Export functionality for SVG and PNG formats

### 🔬 Variant Analysis
- ClinVar integration for pathogenic, benign, and VUS annotations
- gnomAD frequency data visualization
- Interactive variant statistics and filtering
- Genomic coordinate mapping

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- Yarn package manager

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd RNUdb
```

2. Install dependencies:
```bash
yarn install
```

3. Start the development server:
```bash
yarn dev
```

4. Open your browser and navigate to `http://localhost:5173`

### Available Scripts

- `yarn dev` - Start development server
- `yarn build` - Build for production
- `yarn lint` - Run ESLint
- `yarn preview` - Preview production build

## Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── ui/              # shadcn/ui components
│   ├── RNAViewer/       # RNA structure visualization
│   ├── GenomeBrowser/   # Genomic data visualization
│   └── ...
├── pages/               # Main application pages
│   ├── Home.tsx         # Landing page
│   ├── Gene.tsx         # Gene detail page
│   └── Editor.tsx       # RNA editor
├── data/                # Static data files
├── lib/                 # Utility functions
├── types/               # TypeScript type definitions
└── ...

```
## License

This project is licensed under the MIT License - see the LICENSE file for details.

