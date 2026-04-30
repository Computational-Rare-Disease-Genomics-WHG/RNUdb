import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/AuthContext';
import Home from './pages/Home';
import Gene from './pages/Gene';
import Editor from './pages/Editor';
import Login from './pages/Login';
import Admin from './pages/Admin';
import Curate from './pages/Curate';

function ProtectedEditor() {
  const { isCurator, isLoading } = useAuth();
  if (isLoading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  return isCurator ? <Editor /> : <Navigate to="/login" />;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/gene/:geneId" element={<Gene />} />
          <Route path="/editor" element={<ProtectedEditor />} />
          <Route path="/login" element={<Login />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/curate" element={<Curate />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App
