"use client";
import React, { useEffect, useMemo, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import AuthWrapper from "@/context/AuthWrapper";
import { useTranslation } from "react-i18next";
import { cardColors as palette } from "@/components/cardColors";
import { gsap } from "gsap";

type Item = { id: string; title: string; desc: string };

type ProjectRecord = {
  id: string;
  createdAt: string;
  language?: string;
  selections: {
    goal: Item | null;
    pillar: Item | null;
    service: Item | null;
    subService: Item | null;
  };
  ids: {
    goalId: string | null;
    pillarId: string | null;
    serviceId: string | null;
    subServiceId: string | null;
  };
  details: any;
};

export default function ProjectDetailPage() {
  const { t } = useTranslation("common");
  const params = useParams();
  const router = useRouter();
  const id = (params?.id as string) || "";
  const [project, setProject] = useState<ProjectRecord | null>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const sectionsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("projects");
      const parsed: ProjectRecord[] = raw ? JSON.parse(raw) : [];
      const found = parsed.find((p) => p.id === id) || null;
      setProject(found);
    } catch (e) {
      console.error("Failed to load project", e);
      setProject(null);
    }
  }, [id]);

  useEffect(() => {
    // GSAP animations
    if (titleRef.current) {
      gsap.fromTo(
        titleRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 1.2, ease: "power2.out" }
      );
    }

    if (sectionsRef.current.length > 0) {
      gsap.fromTo(
        sectionsRef.current,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.2,
          ease: "power2.out",
          delay: 0.5,
        }
      );
    }
  }, [project]);

  const notFound = useMemo(() => !project, [project]);

  if (notFound) {
    return (
      <AuthWrapper>
        <main className="min-h-screen bg-gray-50 flex items-center justify-center px-6 py-12">
          <div className="text-center">
            <p className="text-gray-600 text-lg font-medium mb-6">{t("notFound")}</p>
            <Link href="/projects" className="text-teal-600 underline hover:text-teal-800 transition-colors">
              {t("myProjects")}
            </Link>
          </div>
        </main>
      </AuthWrapper>
    );
  }

  const d = project!.details || {};
  // Colorize by goal for a cohesive theme
  const colorIdx = (() => {
    const key = project!.selections.goal?.id || project!.selections.goal?.title || project!.id;
    let hash = 0;
    for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
    return hash % palette.length;
  })();
  const color = palette[colorIdx];

  return (
    <AuthWrapper>
      <main className="min-h-screen bg-gray-50 font-sans">
        {/* Hero header with goal color and gradient overlay */}
        <div className={`relative ${color.bg} text-white overflow-hidden`}>
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-transparent pointer-events-none" />
          <div className="px-6 md:px-8 lg:px-16 xl:px-44 py-16">
            <div className="max-w-6xl mx-auto">
              <div className="flex items-center justify-between">
                <h1 ref={titleRef} className="text-4xl md:text-5xl font-bold tracking-tight drop-shadow-md">
                  {project!.selections.goal?.desc || t("goal")}
                </h1>
                <Link href="/projects" className="text-white/90 underline hover:text-white transition-colors">
                  {t("back")}
                </Link>
              </div>
    
              <div className="mt-6 text-sm text-white/80">
                {new Date(project!.createdAt).toLocaleString()}
              </div>
              <div className="mt-6 flex flex-wrap gap-3 text-sm">
                {project!.selections.pillar?.title && (
                  <span className="px-3 py-1.5 rounded-full bg-white/25 backdrop-blur-md hover:bg-white/30 transition-colors">
                    {project!.selections.pillar.title}
                  </span>
                )}
                {project!.selections.service?.title && (
                  <span className="px-3 py-1.5 rounded-full bg-white/25 backdrop-blur-md hover:bg-white/30 transition-colors">
                    {project!.selections.service.title}
                  </span>
                )}
                {project!.selections.subService?.title && (
                  <span className="px-3 py-1.5 rounded-full bg-white/25 backdrop-blur-md hover:bg-white/30 transition-colors">
                    {project!.selections.subService.title}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content sections */}
        <div className="px-6 md:px-8 lg:px-16 xl:px-44 py-16">
          <div className="max-w-6xl mx-auto grid grid-cols-1 gap-8">
            <section
              ref={(el) => (sectionsRef.current[0] = el)}
              className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200 hover:shadow-xl transition-shadow"
            >
              <h2 className="text-xl font-semibold text-teal-700 mb-4">{t("pillar")}</h2>
              <p className="text-gray-700 leading-relaxed">{project!.selections.pillar?.desc || t("notSelected")}</p>
            </section>

            <section
              ref={(el) => (sectionsRef.current[1] = el)}
              className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200 hover:shadow-xl transition-shadow"
            >
              <h2 className="text-xl font-semibold text-teal-700 mb-4">{t("service")}</h2>
              <p className="text-gray-700 leading-relaxed">{project!.selections.service?.desc || t("notSelected")}</p>
            </section>

            <section
              ref={(el) => (sectionsRef.current[2] = el)}
              className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200 hover:shadow-xl transition-shadow"
            >
              <h2 className="text-xl font-semibold text-teal-700 mb-4">{t("subService")}</h2>
              <p className="text-gray-700 leading-relaxed">{project!.selections.subService?.desc || t("notSelected")}</p>
            </section>

            <section
              ref={(el) => (sectionsRef.current[3] = el)}
              className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200 hover:shadow-xl transition-shadow"
            >
              <h2 className="text-xl font-semibold text-teal-700 mb-6">{t("projectDetails")}</h2>

              {d?.title && (
                <div className="mb-6">
                  <p className="font-medium text-gray-800 mb-2">{t("title")}</p>
                  <p className="text-gray-700 leading-relaxed">{d.title}</p>
                </div>
              )}
              {d?.brief && (
                <div className="mb-6">
                  <p className="font-medium text-gray-800 mb-2">{t("brief")}</p>
                  <p className="text-gray-700 leading-relaxed">{d.brief}</p>
                </div>
              )}
              {d?.rationale && (
                <div className="mb-6">
                  <p className="font-medium text-gray-800 mb-2">{t("rationaleImpact")}</p>
                  <p className="text-gray-700 leading-relaxed">{d.rationale}</p>
                </div>
              )}

              {Array.isArray(d?.beneficiaries) && d.beneficiaries.length > 0 && (
                <div className="mb-6">
                  <p className="font-medium text-gray-800 mb-2">{t("beneficiaries")}</p>
                  <p className="text-gray-700 leading-relaxed">{d.beneficiaries.join(", ")}</p>
                </div>
              )}
              {d?.otherBeneficiary && (
                <div className="mb-6">
                  <p className="font-medium text-gray-800 mb-2">{t("otherBeneficiaries")}</p>
                  <p className="text-gray-700 leading-relaxed">{d.otherBeneficiary}</p>
                </div>
              )}

              {(d?.startDate || d?.endDate) && (
                <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="font-medium text-gray-800 mb-2">{t("startDate")}</p>
                    <p className="text-gray-700 leading-relaxed">{d.startDate}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-800 mb-2">{t("endDate")}</p>
                    <p className="text-gray-700 leading-relaxed">{d.endDate}</p>
                  </div>
                </div>
              )}

              {d?.budget && (
                <div className="mb-6">
                  <p className="font-medium text-gray-800 mb-2">{t("budget")}</p>
                  <p className="text-gray-700 leading-relaxed">
                    {t("budgetLabel_icesco")}: {d.budget.icesco} {t("currencyUSD")} · {t("budgetLabel_member_state")}: {d.budget.member_state} {t("currencyUSD")} · {t("budgetLabel_sponsorship")}: {d.budget.sponsorship} {t("currencyUSD")}
                  </p>
                </div>
              )}

              {d?.projectFrequency && (
                <div className="mb-6">
                  <p className="font-medium text-gray-800 mb-2">{t("frequency")}</p>
                  <p className="text-gray-700 leading-relaxed">{d.projectFrequency}{d.frequencyDuration ? ` (${d.frequencyDuration})` : ""}</p>
                </div>
              )}

              {Array.isArray(d?.partners) && d.partners.length > 0 && (
                <div className="mb-6">
                  <p className="font-medium text-gray-800 mb-2">{t("partners")}</p>
                  <p className="text-gray-700 leading-relaxed">{d.partners.join(", ")}</p>
                </div>
              )}

              {(d?.deliveryModality || d?.geographicScope || d?.conveningMethod) && (
                <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <p className="font-medium text-gray-800 mb-2">{t("deliveryModality")}</p>
                    <p className="text-gray-700 leading-relaxed">{d.deliveryModality}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-800 mb-2">{t("geographicScope")}</p>
                    <p className="text-gray-700 leading-relaxed">{d.geographicScope}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-800 mb-2">{t("conveningMethod")}</p>
                    <p className="text-gray-700 leading-relaxed">{d.conveningMethod}{d.conveningMethodOther ? ` (${d.conveningMethodOther})` : ""}</p>
                  </div>
                </div>
              )}

              {Array.isArray(d?.milestones) && d.milestones.length > 0 && (
                <div className="mb-6">
                  <p className="font-medium text-gray-800 mb-2">{t("milestones")}</p>
                  <p className="text-gray-700 leading-relaxed">{d.milestones.join(", ")}</p>
                </div>
              )}
              {d?.expectedOutputs && (
                <div className="mb-6">
                  <p className="font-medium text-gray-800 mb-2">{t("expectedOutputs")}</p>
                  <p className="text-gray-700 leading-relaxed">{d.expectedOutputs}</p>
                </div>
              )}
              {Array.isArray(d?.kpis) && d.kpis.length > 0 && (
                <div className="mb-6">
                  <p className="font-medium text-gray-800 mb-2">{t("kpis")}</p>
                  <p className="text-gray-700 leading-relaxed">{d.kpis.join(", ")}</p>
                </div>
              )}

              {d?.contact && (
                <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="font-medium text-gray-800 mb-2">{t("name")}</p>
                    <p className="text-gray-700 leading-relaxed">{d.contact.name}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-800 mb-2">{t("email")}</p>
                    <p className="text-gray-700 leading-relaxed">{d.contact.email}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-800 mb-2">{t("phone")}</p>
                    <p className="text-gray-700 leading-relaxed">{d.contact.phone}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-800 mb-2">{t("role")}</p>
                    <p className="text-gray-700 leading-relaxed">{d.contact.role}</p>
                  </div>
                </div>
              )}

              {Array.isArray(d?.files) && d.files.length > 0 && (
                <div className="mb-6">
                  <p className="font-medium text-gray-800 mb-3">{t("supportingDocuments")}</p>
                  <div className="space-y-2 text-sm text-gray-700">
                    {d.files.map((f: any, idx: number) => (
                      <div key={idx} className="flex items-center gap-3">
                        <span className="w-2 h-2 rounded-full bg-teal-500" /> {f.name} {f.size ? `(${Math.round(f.size / 1024)} KB)` : ""}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {d?.comments && (
                <div className="mb-4">
                  <p className="font-medium text-gray-800 mb-2">{t("comments")}</p>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{d.comments}</p>
                </div>
              )}
            </section>
          </div>
        </div>
      </main>
    </AuthWrapper>
  );
}