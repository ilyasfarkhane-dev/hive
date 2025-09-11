"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import AuthWrapper from "@/context/AuthWrapper";
import { useTranslation } from "react-i18next";
import { cardColors as palette } from "@/components/cardColors";
import Image from "next/image";
import logo from "@/public/Logo-01.svg";
import vectorBg from "@/public/about.png";
import { gsap } from "gsap";
import { Search, Filter, Plus, Calendar, Eye, TrendingUp } from "lucide-react";

type ProjectRecord = {
  id: string;
  createdAt: string;
  language?: string;
  selections: {
    goal: { id: string; title: string; desc: string } | null;
    pillar: { id: string; title: string; desc: string } | null;
    service: { id: string; title: string; desc: string } | null;
    subService: { id: string; title: string; desc: string } | null;
  };
  ids: {
    goalId: string | null;
    pillarId: string | null;
    serviceId: string | null;
    subServiceId: string | null;
  };
  details: any;
};

export default function ProjectsPage() {
  const { t } = useTranslation("common");
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<ProjectRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "title">("date");
  const [showFilters, setShowFilters] = useState(false);
  const cardRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const headerRef = useRef<HTMLElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<{
    visible: boolean;
    text: string;
    x: number;
    y: number;
  }>({ visible: false, text: "", x: 0, y: 0 });

  useEffect(() => {
    try {
      const raw = localStorage.getItem("projects");
      const parsed = raw ? JSON.parse(raw) : [];
      setProjects(parsed);
      setFilteredProjects(parsed);
    } catch (e) {
      console.error("Failed to load projects", e);
      setProjects([]);
      setFilteredProjects([]);
    }
  }, []);

  // Filter and sort projects
  useEffect(() => {
    let filtered = projects.filter((project) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        project.details?.title?.toLowerCase().includes(searchLower) ||
        project.selections.goal?.title?.toLowerCase().includes(searchLower) ||
        project.selections.pillar?.title?.toLowerCase().includes(searchLower) ||
        project.selections.service?.title?.toLowerCase().includes(searchLower)
      );
    });

    // Sort projects
    filtered.sort((a, b) => {
      if (sortBy === "date") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      } else {
        return (a.details?.title || "").localeCompare(b.details?.title || "");
      }
    });

    setFilteredProjects(filtered);
  }, [projects, searchTerm, sortBy]);

  const empty = useMemo(() => filteredProjects.length === 0, [filteredProjects.length]);

  const getColorIndex = (p: ProjectRecord) => {
    const key = p.selections.goal?.id || p.selections.goal?.title || p.id;
    let hash = 0;
    for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
    return hash % palette.length;
  };

  // GSAP animations
  useEffect(() => {
    const ctx = gsap.context(() => {
      // Header animation
      if (headerRef.current) {
        gsap.fromTo(
          headerRef.current,
          { opacity: 0, y: -30 },
          { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" }
        );
      }

      // Toolbar animation
      if (toolbarRef.current) {
        gsap.fromTo(
          toolbarRef.current,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.6, ease: "power2.out", delay: 0.2 }
        );
      }

      // Cards animation
      if (!empty && cardRefs.current.length > 0) {
        const targets = cardRefs.current.filter(Boolean) as HTMLElement[];
        gsap.fromTo(
          targets,
          { opacity: 0, y: 30, scale: 0.95 },
          { 
            opacity: 1, 
            y: 0, 
            scale: 1, 
            duration: 0.6, 
            stagger: 0.1, 
            ease: "power2.out",
            delay: 0.4
          }
        );
      }
    });

    return () => ctx.revert();
  }, [empty, filteredProjects.length]);

  // Handle mouse enter to show tooltip
  const handleMouseEnter = (
    e: React.MouseEvent<HTMLSpanElement>,
    desc: string
  ) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltip({
      visible: true,
      text: desc,
      x: rect.left + rect.width / 2, // Center horizontally
      y: rect.top - 40, // Position above the element
    });
  };

  // Handle mouse leave to hide tooltip
  const handleMouseLeave = () => {
    setTooltip({ visible: false, text: "", x: 0, y: 0 });
  };

  return (
    <AuthWrapper>
      <div className="min-h-screen bg-gray-50">
        {/* Tooltip */}
        {tooltip.visible && (
          <div
            className="fixed z-50 bg-gray-900 text-white text-sm px-3 py-2 rounded-lg shadow-lg max-w-xs pointer-events-none"
            style={{
              left: `${tooltip.x}px`,
              top: `${tooltip.y}px`,
              transform: "translate(-50%, -100%)",
            }}
          >
            {tooltip.text}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
          </div>
        )}

        {/* Header */}
        <header ref={headerRef} className="relative bg-primary overflow-hidden">
          <Image src={vectorBg} alt="bg" className="absolute right-0 top-0 h-full max-lg:hidden" />
          <div className="relative z-10 px-5 md:px-[1.9rem] largesceen:px-14 fourk:px-44 py-12">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <Image src={logo} alt="Logo" width={80} height={80} />
                  <div>
                    <h1 className="text-white-100 text-2xl md:text-3xl font-extrabold tracking-tight">
                      {t("myProjects")}
                    </h1>
                    <p className="text-white/80 text-sm mt-1">
                      {filteredProjects.length} {filteredProjects.length === 1 ? "project" : "projects"}
                    </p>
                  </div>
                </div>
                <Link
                  href="/"
                  className="bg-secondary hover:bg-[#FCC000] text-primary font-semibold px-6 py-3 rounded-lg transition-colors flex items-center gap-2"
                >
                  <Plus size={20} />
                  New Project
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* Toolbar */}
        <div ref={toolbarRef} className="bg-white border-b border-gray-200 sticky top-0 z-40">
          <div className="px-5 md:px-[1.9rem] largesceen:px-14 fourk:px-44 py-4">
            <div className="max-w-7xl mx-auto">
              <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      placeholder="Search projects..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent w-full sm:w-64"
                    />
                  </div>
                  
                  {/* Sort */}
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as "date" | "title")}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="date">Sort by Date</option>
                    <option value="title">Sort by Title</option>
                  </select>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Calendar size={16} />
                    <span>Total: {projects.length}</span>
                  </div>
                  {searchTerm && (
                    <div className="flex items-center gap-1">
                      <Eye size={16} />
                      <span>Filtered: {filteredProjects.length}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="px-5 md:px-[1.9rem] largesceen:px-14 fourk:px-44 py-8">
          <div className="max-w-7xl mx-auto">
            {empty ? (
              <div className="text-center py-16">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <TrendingUp className="text-gray-400" size={32} />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {searchTerm ? "No projects found" : "No projects yet"}
                </h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  {searchTerm 
                    ? "Try adjusting your search terms or filters to find what you're looking for."
                    : "Start by creating your first project proposal to get started with the ICESCO strategy."
                  }
                </p>
                {!searchTerm && (
                  <Link
                    href="/"
                    className="inline-flex items-center gap-2 bg-primary hover:bg-[#0a5559] text-white font-semibold px-6 py-3 rounded-lg transition-colors"
                  >
                    <Plus size={20} />
                    Create Your First Project
                  </Link>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredProjects.map((p, index) => {
                  const idx = getColorIndex(p);
                  const color = palette[idx];
                  return (
                    <Link
                      key={p.id}
                      href={`/projects/${p.id}`}
                      className="group block"
                      ref={(el) => {
                        if (el) cardRefs.current[index] = el;
                      }}
                    >
                      <article className={`rounded-2xl relative overflow-hidden transform transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl shadow-lg ${color.bg} h-full`}>
                        <div className="absolute inset-0 bg-gradient-to-br from-black/10 to-transparent" />
                        
                        <div className="relative p-6 h-full flex flex-col text-white">
                          {/* Header */}
                          <div className="flex items-start justify-between mb-4">
                            <div className="text-xs opacity-80 flex items-center gap-1">
                              <Calendar size={12} />
                              {new Date(p.createdAt).toLocaleDateString()}
                            </div>
                            <div className="w-2 h-2 bg-white/30 rounded-full"></div>
                          </div>

                          {/* Title */}
                          <h2 className="text-lg font-bold tracking-tight mb-3 line-clamp-2">
                            {p.details?.title || p.selections.goal?.title || "Untitled Project"}
                          </h2>

                          {/* Goal Badge */}
                          <div className="mb-4">
                            <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-medium">
                              {p.selections.goal?.title || t("goal")}
                            </span>
                          </div>

                          {/* Tags */}
                          <div className="flex flex-wrap gap-2 mb-4">
                            {p.selections.pillar?.title && (
                              <span 
                                className="px-2 py-1 bg-white/15 backdrop-blur-sm rounded-full text-xs cursor-help"
                                onMouseEnter={(e) => handleMouseEnter(e, p.selections.pillar?.desc || "")}
                                onMouseLeave={handleMouseLeave}
                              >
                                {p.selections.pillar.title}
                              </span>
                            )}
                            {p.selections.service?.title && (
                              <span 
                                className="px-2 py-1 bg-white/15 backdrop-blur-sm rounded-full text-xs cursor-help"
                                onMouseEnter={(e) => handleMouseEnter(e, p.selections.service?.desc || "")}
                                onMouseLeave={handleMouseLeave}
                              >
                                {p.selections.service.title}
                              </span>
                            )}
                          </div>

                          {/* Description */}
                          {p.selections.goal?.desc && (
                            <p className="text-sm text-white/90 line-clamp-2 mb-4 flex-grow">
                              {p.selections.goal.desc}
                            </p>
                          )}

                          {/* Footer */}
                          <div className="flex items-center justify-between pt-4 border-t border-white/20">
                            <span className="text-sm font-medium opacity-90">
                              {t("view")} →
                            </span>
                            <div className="flex items-center gap-2 text-xs opacity-70">
                              <Eye size={14} />
                              <span>View Details</span>
                            </div>
                          </div>
                        </div>
                      </article>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>
    </AuthWrapper>
  );
}