import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { useAuth } from "./context/AuthContext";
import APIDocs from "./pages/APIDocs";
import About from "./pages/About";
import Admin from "./pages/Admin";
import ClinicalInterpretation from "./pages/ClinicalInterpretation";
import Curate from "./pages/Curate";
import Editor from "./pages/Editor";
import Gene from "./pages/Gene";
import Home from "./pages/Home";
import HowToUse from "./pages/HowToUse";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import { TooltipProvider } from "@/components/ui/tooltip";

function ProtectedEditor() {
  const { isCurator, isLoading } = useAuth();
  if (isLoading)
    return (
      <div className="min-h-screen flex items-center justify-center">Loading...</div>
    );
  return isCurator ? <Editor /> : <Navigate to="/login" />;
}

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
            <Route path="/admin" element={<Admin />} />
            <Route path="/curate" element={<Curate />} />
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
