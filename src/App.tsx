import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import {
  ProtectedEditor,
  ProtectedCurate,
  ProtectedAdmin,
} from "./components/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";
import APIDocs from "./pages/APIDocs";
import About from "./pages/About";
import ClinicalInterpretation from "./pages/ClinicalInterpretation";
import Gene from "./pages/Gene";
import Home from "./pages/Home";
import HowToUse from "./pages/HowToUse";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import { TooltipProvider } from "@/components/ui/tooltip";

function App() {
  return (
    <AuthProvider>
      <TooltipProvider>
        <Router>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[60] focus:px-4 focus:py-2 focus:bg-teal-600 focus:text-white focus:rounded-lg focus:shadow-lg"
          >
            Skip to main content
          </a>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/gene/:geneId" element={<Gene />} />
            <Route path="/editor" element={<ProtectedEditor />} />
            <Route path="/login" element={<Login />} />
            <Route path="/admin" element={<ProtectedAdmin />} />
            <Route path="/curate" element={<ProtectedCurate />} />
            <Route path="/api-docs" element={<APIDocs />} />
            <Route
              path="/clinical-interpretation"
              element={<ClinicalInterpretation />}
            />
            <Route path="/how-to-use" element={<HowToUse />} />
            <Route path="/about" element={<About />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
      </TooltipProvider>
    </AuthProvider>
  );
}

export default App;
