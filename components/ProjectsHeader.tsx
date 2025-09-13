"use client";
import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import Image from "next/image";
import { useTranslation } from "react-i18next";
import { useI18n } from "@/context/I18nProvider";
import { useRouter } from "next/navigation";
import vector14 from "@/public/maquettes.png";
import image1 from "@/public/Logo-01.svg";
import BurgerMenu from "./BurgerMenu";
import LanguageSwitcher from "./LanguageSwitcher";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface ProjectsHeaderProps {
  breadcrumbs?: BreadcrumbItem[];
}

const ProjectsHeader = ({ breadcrumbs }: ProjectsHeaderProps) => {
  const { t } = useTranslation("common");
  const { isRTL, currentLanguage } = useI18n();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentRTL, setCurrentRTL] = useState(false);
  const [isLanguageLoaded, setIsLanguageLoaded] = useState(false);

  const containerRef = useRef<HTMLElement>(null);
  const logoRef = useRef<HTMLImageElement>(null);
  const textRefs = useRef<HTMLDivElement[]>([]);

  // Function to add ref to textRefs array
  const addTextRef = (el: HTMLDivElement | null) => {
    if (el && !textRefs.current.includes(el)) {
      textRefs.current.push(el);
    }
  };

  // Update RTL state when language changes or on mount
  useEffect(() => {
    setCurrentRTL(isRTL);
    setIsLanguageLoaded(true);
  }, [isRTL, currentLanguage]);

  // Additional effect to ensure RTL state is set correctly on page load
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedLanguage = localStorage.getItem('i18nextLng') || 'en';
      const isArabic = savedLanguage === 'ar';
      setCurrentRTL(isArabic);
      setIsLanguageLoaded(true);
    }
  }, []);

  // Clear refs when language changes
  useEffect(() => {
    textRefs.current = [];
  }, [currentLanguage]);

  useEffect(() => {
    // Only run animations when language is loaded and elements are rendered
    if (!isLanguageLoaded) return;

    console.log('ProjectsHeader GSAP Animation starting...', {
      logoRef: !!logoRef.current,
      textRefs: textRefs.current.length,
      containerRef: !!containerRef.current
    });

    const ctx = gsap.context(() => {
      // Safety check for logo element
      if (logoRef.current) {
        console.log('Animating ProjectsHeader logo...');
        gsap.fromTo(
          logoRef.current,
          { opacity: 0, y: 20, scale: 0.95 },
          { opacity: 1, y: 0, scale: 1, duration: 0.8, ease: "power3.out" }
        );
      }

      // Safety check for text elements
      if (textRefs.current && textRefs.current.length > 0) {
        console.log('Animating ProjectsHeader text elements...', textRefs.current.length);
        gsap.fromTo(
          textRefs.current,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.8, ease: "power3.out", stagger: 0.2 }
        );
      }
    }, containerRef);

    return () => ctx.revert();
  }, [isLanguageLoaded]);

  return (
    <section
      ref={containerRef}
      className="relative bg-gradient-to-br from-teal-600 via-teal-700 to-teal-800 py-12 lg:py-16 overflow-hidden"
      style={{ direction: 'ltr' }}
    >
      {/* Background Image */}
      <Image
        src={vector14}
        alt={t("vectorLine")}
        className="absolute right-0 top-0 h-full w-full object-cover block opacity-90"
        style={{ 
          position: 'absolute',
          right: '0',
          top: '0',
          zIndex: 1,
          transform: 'none',
          direction: 'ltr',
          left: 'auto'
        }}
      />

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
          {/* Logo */}
          <div className="flex justify-center items-center lg:flex-1">
            <Image
              ref={logoRef}
              priority
              src={image1}
              alt={t("logo")}
              width={150}
              height={60}
              className="w-24 sm:w-28 md:w-32 lg:w-36 h-auto"
            />
          </div>

          {/* Navigation Controls */}
          <div 
            className="absolute top-4 right-4 flex flex-row items-center gap-3 z-[99999]"
            style={{
              position: 'absolute',
              top: '1rem',
              right: '1rem',
              left: 'auto',
              zIndex: 99999,
              direction: 'ltr'
            }}
          >
            
            <BurgerMenu isOpen={isMenuOpen} setIsOpen={setIsMenuOpen} />
          </div>

          {/* Text Content */}
          <div 
            key={`text-content-${currentLanguage}`} 
            className="flex flex-col lg:flex-1 relative text-center lg:text-left"
            style={{
              order: 2,
              direction: 'ltr'
            }}
          >
            <div 
              key={`text-container-${currentLanguage}`} 
              className="flex flex-col justify-center relative" 
              dir={currentRTL ? 'rtl' : 'ltr'} 
              style={{ direction: currentRTL ? 'rtl' : 'ltr' }}
            >
              <h1
                ref={addTextRef}
                className="uppercase text-white text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold"
                style={{ 
                  direction: currentRTL ? 'rtl' : 'ltr', 
                  textAlign: 'center',
                  unicodeBidi: 'normal',
                  textJustify: 'inter-word',
                  wordSpacing: 'normal',
                  writingMode: 'horizontal-tb'
                }}
              >
                {t("myProjects")}
              </h1>
              
              <p
                ref={addTextRef}
                className="text-white text-opacity-90 text-sm sm:text-base md:text-lg mt-2 max-w-2xl mx-auto lg:mx-0"
                dir={currentRTL ? 'rtl' : 'ltr'}
                style={{ 
                  direction: currentRTL ? 'rtl' : 'ltr', 
                  textAlign: 'center',
                  textAlignLast: 'center',
                  unicodeBidi: 'normal',
                  textJustify: 'inter-word',
                  wordSpacing: 'normal',
                  writingMode: 'horizontal-tb'
                }}
              >
                {t("viewManageProjects")}
              </p>

              {/* Breadcrumb */}
              {breadcrumbs && breadcrumbs.length > 0 && (
                <div className="mt-4">
                  <nav className="flex items-center justify-center space-x-2 text-sm">
                    <svg className="w-4 h-4 text-white/70 " fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z" />
                    </svg>
                    {breadcrumbs.map((item, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        {index > 0 && (
                          <svg className="w-4 h-4 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        )}
                        {item.href ? (
                          <button
                            onClick={() => router.push(item.href!)}
                            className="text-white/80 hover:text-white transition-colors  duration-200"
                          >
                            {item.label}
                          </button>
                        ) : (
                          <span className="text-white font-medium">{item.label}</span>
                        )}
                      </div>
                    ))}
                  </nav>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProjectsHeader;
