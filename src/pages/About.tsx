import {
  Mail,
  Users,
  Award,
  Building2,
  HeartHandshake,
  Dna,
  ExternalLink,
  Bug,
} from "lucide-react";
import React from "react";
import Footer from "../components/Footer";
import Header from "../components/Header";

interface TeamMember {
  name: string;
  role: string;
  initials: string;
}

const funders = [
  { name: "Wellcome Trust", logo: "/images/wellcome-trust.png", class: "h-14" },
  { name: "MRC CoRE", logo: "/images/mrc.png", class: "h-16" },
];

const institutions = [
  {
    name: "Big Data Institute",
    logo: "/images/bdi.jpeg",
    location: "University of Oxford",
  },
  {
    name: "Centre for Human Genomics",
    logo: "/images/chg.png",
    location: "University of Oxford",
  },
  {
    name: "University of Oxford",
    logo: "/images/oxford.png",
    location: "Oxford, United Kingdom",
  },
];

const teamMembers: TeamMember[] = [
  { name: "Elston D'Souza", role: "Developer / Maintainer", initials: "ED" },
  { name: "Alexander Blakes", role: "Maintainer", initials: "AB" },
  { name: "Stephan Sanders", role: "Supervisor", initials: "SS" },
  { name: "Nicky Whiffin", role: "Supervisor", initials: "NW" },
];

const About: React.FC = () => {
  return (
    <div
      id="main-content"
      tabIndex={-1}
      className="min-h-screen bg-white flex flex-col"
    >
      <Header showSearch={false} />

      <div className="bg-gradient-to-br from-teal-700 via-teal-800 to-teal-900 text-white">
        <div className="max-w-5xl mx-auto px-6 py-20 pt-28">
          <div className="flex items-center gap-3 mb-4">
            <Dna className="h-8 w-8 text-teal-300" />
          </div>
          <h1 className="text-4xl font-bold mb-4 tracking-tight">About RNUdb</h1>
          <p className="text-teal-100 text-lg max-w-2xl leading-relaxed">
            A centralised resource for exploring small nuclear RNA variation and its
            role in human disease.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-16 w-full flex-1">
        <div className="max-w-3xl">
          <p className="text-slate-600 text-lg leading-relaxed">
            RNUdb integrates data from gnomAD, ClinVar, and published literature to
            provide researchers and clinicians with a comprehensive view of snRNA
            variants and their clinical significance.
          </p>
        </div>

        <hr className="my-14 border-slate-200" />

        <section>
          <div className="flex items-center gap-3 mb-8">
            <Award className="h-5 w-5 text-teal-600" />
            <h2 className="text-lg font-semibold text-slate-800">Funded by</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {funders.map((funder) => (
              <div
                key={funder.name}
                className="bg-slate-50 rounded-xl p-10 flex items-center justify-center min-h-[120px]"
              >
                <img
                  src={funder.logo}
                  alt={funder.name}
                  className={funder.class + " object-contain"}
                />
              </div>
            ))}
          </div>
        </section>

        <hr className="my-14 border-slate-200" />

        <section>
          <div className="flex items-center gap-3 mb-8">
            <Building2 className="h-5 w-5 text-teal-600" />
            <h2 className="text-lg font-semibold text-slate-800">Institutions</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {institutions.map((inst) => (
              <div
                key={inst.name}
                className="bg-slate-50 rounded-xl p-8 flex flex-col items-center text-center"
              >
                <img
                  src={inst.logo}
                  alt={inst.name}
                  className="h-14 object-contain mb-5"
                />
                <h3 className="font-semibold text-slate-800 text-sm">{inst.name}</h3>
                <p className="text-xs text-slate-400 mt-1">{inst.location}</p>
              </div>
            ))}
          </div>
        </section>

        <hr className="my-14 border-slate-200" />

        <section>
          <div className="flex items-center gap-3 mb-8">
            <Users className="h-5 w-5 text-teal-600" />
            <h2 className="text-lg font-semibold text-slate-800">Team</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {teamMembers.map((member) => (
              <div
                key={member.name}
                className="bg-slate-50 rounded-xl p-6 flex flex-col items-center text-center"
              >
                <div className="w-14 h-14 rounded-full bg-teal-600 flex items-center justify-center mb-4 shadow-sm">
                  <span className="text-white font-bold text-lg">
                    {member.initials}
                  </span>
                </div>
                <h3 className="font-semibold text-slate-800 text-sm">{member.name}</h3>
                <p className="text-xs text-slate-500 mt-1.5">{member.role}</p>
              </div>
            ))}
          </div>
        </section>

        <hr className="my-14 border-slate-200" />

        <section className="text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Mail className="h-5 w-5 text-teal-600" />
            <h2 className="text-lg font-semibold text-slate-800">Contact</h2>
          </div>
          <p className="text-slate-500 text-sm mb-5">
            Questions, suggestions, or collaboration inquiries
          </p>
          <div className="inline-flex items-center gap-3 bg-slate-50 rounded-xl px-6 py-4 mb-4">
            <HeartHandshake className="h-5 w-5 text-teal-600 shrink-0" />
            <div className="text-left">
              <p className="font-medium text-slate-800 text-sm">Nicky Whiffin</p>
              <a
                href="mailto:nwhiffin@well.ox.ac.uk"
                className="inline-flex items-center gap-1 text-teal-600 hover:text-teal-700 text-sm group"
              >
                nwhiffin@well.ox.ac.uk
                <ExternalLink className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
              </a>
            </div>
          </div>
          <div>
            <a
              href="https://github.com/Computational-Rare-Disease-Genomics-WHG/RNUdb/issues"
              className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-teal-600 transition-colors"
            >
              <Bug className="h-4 w-4" />
              Found an issue? Open a GitHub ticket
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
};

export default About;
