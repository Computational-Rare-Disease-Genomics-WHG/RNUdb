import { LogIn, Github, Mail } from "lucide-react";
import React from "react";
import Footer from "../components/Footer";
import Header from "../components/Header";
import { useAuth } from "../context/AuthContext";
import { Button } from "@/components/ui/button";

const Login: React.FC = () => {
  const { isLoading, isPending, isLoggedIn, user, login, logout } = useAuth();

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
            <div className="text-lg text-gray-600">Checking session...</div>
          </div>
        </div>
      );
    }

    if (isPending && user) {
      return (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Mail className="w-10 h-10 text-yellow-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Account Pending Approval
            </h1>
            <p className="text-gray-600 mb-6">
              Hi {user.name}, your GitHub account ({user.github_login}) is
              awaiting curator approval.
            </p>
            <p className="text-gray-600 mb-6">
              Please contact Nicky Whiffin to request access:
            </p>
            <a
              href={`mailto:nwhiffin@well.ox.ac.uk?subject=RNUdb Curator Access Request&body=Hi Nicky,%0A%0AI am requesting curator access to RNUdb.%0A%0AGitHub Login: ${user.github_login}%0AName: ${user.name}%0AEmail: ${user.email}%0A%0AThanks!`}
              className="inline-block"
            >
              <Button className="bg-teal-600 hover:bg-teal-700 text-white">
                <Mail className="w-4 h-4 mr-2" />
                Request Access via Email
              </Button>
            </a>
            <div className="mt-6">
              <Button variant="outline" onClick={logout} className="text-sm">
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      );
    }

    if (isLoggedIn && user) {
      return (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Welcome, {user.name}
            </h1>
            <p className="text-gray-600 mb-6">
              You are signed in as a <strong>{user.role}</strong>.
            </p>
            {user.avatar_url && (
              <img
                src={user.avatar_url}
                alt={user.name}
                className="w-16 h-16 rounded-full mx-auto mb-6"
              />
            )}
            <Button variant="outline" onClick={logout}>
              Sign Out
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-20 h-20 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <LogIn className="w-10 h-10 text-teal-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Curator Sign In
          </h1>
          <p className="text-gray-600 mb-8">
            Sign in with your GitHub account to access the curator dashboard.
          </p>
          <Button
            onClick={login}
            className="w-full bg-gray-900 hover:bg-gray-800 text-white h-12"
          >
            <Github className="w-5 h-5 mr-2" />
            Sign in with GitHub
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header showSearch={false} />
      <main className="pt-20">{renderContent()}</main>
      <Footer />
    </div>
  );
};

export default Login;
