"use client";
import React, { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import Image from "next/image";
import { useTranslation } from "react-i18next";
import { useI18n } from "@/context/I18nProvider";
import { useRouter } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";
import LanguageSwitcher from "./LanguageSwitcher";
import BurgerMenu from "./BurgerMenu";

interface Breadcrumb {
  label: string;
  href?: string;
}

interface ProjectsPageHeaderProps {
  className?: string;
  breadcrumbs?: Breadcrumb[];
  
}

// Background component
const BackgroundImage = ({ src, alt }: { src: string; alt: string }) => (
  <Image
    src={src}
    alt={alt}
    width={1920}
    height={1080}
    priority
    className="absolute inset-0 w-full h-full object-cover opacity-80"
    style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      zIndex: 1
    }}
  />
);

// Overlay component
const Overlay = () => (
  <div 
    className="absolute inset-0 bg-black/40 z-10"
    style={{ zIndex: 10 }}
  />
);

// Header controls (language switcher, menu, etc.)
const HeaderControls = ({ onMenuStateChange }: { onMenuStateChange: (isOpen: boolean) => void }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // Notify parent component when menu state changes
  useEffect(() => {
    onMenuStateChange(isMenuOpen);
  }, [isMenuOpen, onMenuStateChange]);
  
  return (
    <div className="absolute top-6 right-6 flex items-center gap-3 z-50">
      <LanguageSwitcher showLabels={false} />
      <BurgerMenu isOpen={isMenuOpen} setIsOpen={setIsMenuOpen} />
    </div>
  );
};

// Breadcrumbs component
const Breadcrumbs = ({ breadcrumbs }: { breadcrumbs: Breadcrumb[] }) => {
  const { t } = useTranslation("common");
  const router = useRouter();

  const handleBreadcrumbClick = (href: string) => {
    router.push(href);
  };

  return (
    <nav className="flex items-center space-x-2 text-sm">
      <button
        onClick={() => handleBreadcrumbClick("/")}
        className="flex items-center text-white/80 hover:text-white transition-colors duration-200"
      >
        <Home className="w-4 h-4 mr-1" />
        {t("home")}
      </button>
      
      {breadcrumbs.map((breadcrumb, index) => (
        <React.Fragment key={index}>
          <ChevronRight className="w-4 h-4 text-white/60" />
          {breadcrumb.href ? (
            <button
              onClick={() => handleBreadcrumbClick(breadcrumb.href!)}
              className="text-white/80 hover:text-white transition-colors duration-200"
            >
              {breadcrumb.label}
            </button>
          ) : (
            <span className="text-white font-medium">
              {breadcrumb.label}
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};

// Page content component
const PageContent = ({ breadcrumbs }: { breadcrumbs: Breadcrumb[] }) => {
  const { t } = useTranslation("common");

  return (
    <div className="relative z-20 flex flex-col justify-center h-full px-6 sm:px-8 md:px-12 lg:px-16 xl:px-24 py-4 sm:py-6 md:py-14 min-h-0">
      {/* Breadcrumbs */}
      <div className="mb-2 sm:mb-4 flex-shrink-0">
        <Breadcrumbs breadcrumbs={breadcrumbs} />
      </div>

      {/* Page Title */}
      <div className="w-full min-w-0 flex-1 flex flex-col justify-center">
        <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold text-white mb-1 sm:mb-2 break-words leading-tight line-clamp-2" 
            title={breadcrumbs[breadcrumbs.length - 1]?.label || t("projects")}>
          {breadcrumbs[breadcrumbs.length - 1]?.label || t("projects")}
        </h1>
        <p className="text-white/90 text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl break-words leading-relaxed line-clamp-2">
          {t("manageAndTrackYourProjects")}
        </p>
      </div>
    </div>
  );
};

const ProjectsPageHeader: React.FC<ProjectsPageHeaderProps> = ({ 
  className = "",
  breadcrumbs = []
}) => {
  const { t } = useTranslation("common");
  const { isRTL, currentLanguage } = useI18n();
  const [isLanguageLoaded, setIsLanguageLoaded] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const containerRef = useRef<HTMLElement>(null);

  // Initialize language loading
  useEffect(() => {
    setIsLanguageLoaded(true);
  }, []);

  // Handle scroll to next section (if needed)
  const handleScrollDown = () => {
    const nextSection = document.querySelector("#projects-content");
    if (nextSection) {
      nextSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Show loading state
  if (!isLanguageLoaded) {
    return (
      <div className="bg-gradient-to-br from-[#0e7378] to-[#1B3B36] h-[0vh] flex items-center justify-center">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <header
      ref={containerRef}
      className={`projects-page-header bg-gradient-to-br from-[#0e7378] to-[#1B3B36] min-h-[25vh] max-h-[35vh] relative overflow-hidden flex flex-col ${className}`}
      style={{ direction: 'ltr' }}
    >
      {/* Background */}
      <BackgroundImage src="/ice-ban.jpg" alt={t("vectorLine")} />
      
      {/* Overlay */}
      <Overlay />
      
      {/* Page Content */}
      <PageContent breadcrumbs={breadcrumbs} />
      
      {/* Header controls */}
      <HeaderControls onMenuStateChange={setIsMenuOpen} />
    </header>
  );
};

export default ProjectsPageHeader;
