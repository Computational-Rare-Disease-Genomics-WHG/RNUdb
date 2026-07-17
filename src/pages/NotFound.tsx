import { FileQuestion, Home } from "lucide-react";
import React from "react";
import { Link } from "react-router-dom";
import Footer from "../components/Footer";
import Header from "../components/Header";
import { Button } from "@/components/ui/button";

const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-slate-50 to-white">
      <Header />
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="text-center space-y-6 max-w-md">
          <FileQuestion className="h-16 w-16 text-slate-300 mx-auto" />
          <h1 className="text-4xl font-bold text-slate-800">404</h1>
          <p className="text-lg text-slate-500">
            The page you&rsquo;re looking for doesn&rsquo;t exist.
          </p>
          <Button asChild variant="outline" className="gap-2">
            <Link to="/">
              <Home className="h-4 w-4" />
              Back to Home
            </Link>
          </Button>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default NotFound;
