import React, { Suspense } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { LoadingSpinner } from "./components/LoadingSpinner";
import {
  ProtectedEditor,
  ProtectedCurate,
  ProtectedAdmin,
} from "./components/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";

// Eager imports for lightweight pages
import Home from "./pages/Home";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import { TooltipProvider } from "@/components/ui/tooltip";

// Lazy imports for heavy pages
const APIDocs = React.lazy(() => import("./pages/APIDocs"));
const About = React.lazy(() => import("./pages/About"));
const ClinicalInterpretation = React.lazy(
  () => import("./pages/ClinicalInterpretation"),
);
const Gene = React.lazy(() => import("./pages/Gene"));
const HowToUse = React.lazy(() => import("./pages/HowToUse"));

// Admin, Curate, Editor are lazy-loaded via ProtectedRoute + Suspense
const Admin = React.lazy(() => import("./pages/Admin"));
const Curate = React.lazy(() => import("./pages/Curate"));
const Editor = React.lazy(() => import("./pages/Editor"));

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
            <Route
              path="/gene/:geneId"
              element={
                <Suspense fallback={<LoadingSpinner />}>
                  <Gene />
                </Suspense>
              }
            />
            <Route
              path="/editor"
              element={
                <ProtectedEditor>
                  <Suspense fallback={<LoadingSpinner />}>
                    <Editor />
                  </Suspense>
                </ProtectedEditor>
              }
            />
            <Route path="/login" element={<Login />} />
            <Route
              path="/admin"
              element={
                <ProtectedAdmin>
                  <Suspense fallback={<LoadingSpinner />}>
                    <Admin />
                  </Suspense>
                </ProtectedAdmin>
              }
            />
            <Route
              path="/curate"
              element={
                <ProtectedCurate>
                  <Suspense fallback={<LoadingSpinner />}>
                    <Curate />
                  </Suspense>
                </ProtectedCurate>
              }
            />
            <Route
              path="/api-docs"
              element={
                <Suspense fallback={<LoadingSpinner />}>
                  <APIDocs />
                </Suspense>
              }
            />
            <Route
              path="/clinical-interpretation"
              element={
                <Suspense fallback={<LoadingSpinner />}>
                  <ClinicalInterpretation />
                </Suspense>
              }
            />
            <Route
              path="/how-to-use"
              element={
                <Suspense fallback={<LoadingSpinner />}>
                  <HowToUse />
                </Suspense>
              }
            />
            <Route
              path="/about"
              element={
                <Suspense fallback={<LoadingSpinner />}>
                  <About />
                </Suspense>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
      </TooltipProvider>
    </AuthProvider>
  );
}

export default App;
