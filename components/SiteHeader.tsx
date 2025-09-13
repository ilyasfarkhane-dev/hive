"use client"
import { useEffect, useRef, useState } from "react"
import { gsap } from "gsap"
import { ScrollToPlugin } from "gsap/ScrollToPlugin"
import Image from "next/image"
import Lottie from "lottie-react"
import vector14 from "@/public/maquettes.png"
import image1 from "@/public/Logo-01.svg"
import BurgerMenu from "./BurgerMenu"
import { useTranslation } from "react-i18next"
import { useI18n } from "@/context/I18nProvider"
import scrollDownAnimation from "@/public/scroll-down.json"
import LanguageSwitcher from "./LanguageSwitcher"

gsap.registerPlugin(ScrollToPlugin)

const About = () => {
  const { t } = useTranslation("common")
  const { isRTL, currentLanguage } = useI18n()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [currentRTL, setCurrentRTL] = useState(false) // Initialize as false
  const [isLanguageLoaded, setIsLanguageLoaded] = useState(false)

  const containerRef = useRef<HTMLElement>(null)
  const logoRef = useRef<HTMLImageElement>(null)
  const textRefs = useRef<HTMLDivElement[]>([])

  // Function to add ref to textRefs array
  const addTextRef = (el: HTMLDivElement | null) => {
    if (el && !textRefs.current.includes(el)) {
      textRefs.current.push(el)
    }
  }

  // Update RTL state when language changes or on mount
  useEffect(() => {
    setCurrentRTL(isRTL)
    setIsLanguageLoaded(true)
  }, [isRTL, currentLanguage])

  // Additional effect to ensure RTL state is set correctly on page load
  useEffect(() => {
    // Check localStorage directly for language on mount
    if (typeof window !== 'undefined') {
      const savedLanguage = localStorage.getItem('i18nextLng') || 'en'
      const isArabic = savedLanguage === 'ar'
      setCurrentRTL(isArabic)
      setIsLanguageLoaded(true)
    }
  }, [])

  // Clear refs when language changes
  useEffect(() => {
    textRefs.current = []
  }, [currentLanguage])

  useEffect(() => {
    // Only run animations when language is loaded and elements are rendered
    if (!isLanguageLoaded) return

    console.log('GSAP Animation starting...', {
      logoRef: !!logoRef.current,
      textRefs: textRefs.current.length,
      containerRef: !!containerRef.current
    })

    const ctx = gsap.context(() => {
      // Safety check for logo element
      if (logoRef.current) {
        console.log('Animating logo...')
        gsap.fromTo(
          logoRef.current,
          { opacity: 0, y: 40, scale: 0.9 },
          { opacity: 1, y: 0, scale: 1, duration: 1.4, ease: "power3.out" }
        )

        gsap.to(logoRef.current, {
          y: "+=8",
          duration: 3,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
          delay: 1.6,
        })
      }

      // Safety check for text elements
      if (textRefs.current && textRefs.current.length > 0) {
        console.log('Animating text elements...', textRefs.current.length)
        gsap.fromTo(
          textRefs.current,
          { opacity: 0, y: 30 },
          { opacity: 1, y: 0, duration: 1.2, stagger: 0.3, ease: "power3.out", delay: 0.4 }
        )
      }
    }, containerRef)

    return () => ctx.revert()
  }, [isLanguageLoaded])

  const handleScrollDown = () => {
    const nextSection = document.querySelector("#next-section");
    if (nextSection) {
      nextSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Show loading state until language is properly loaded
  if (!isLanguageLoaded) {
    return (
      <div className="bg-[#00797d] h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <main
      key={`header-${currentLanguage}`}
      ref={containerRef}
      id="about"
      className="bg-[#00797d] h-screen relative w-full px-5 sm:px-8 md:px-12 lg:px-20 xl:px-32 overflow-hidden"
      style={{
        direction: 'ltr' // Force LTR for the main container
      }}
    >
      {/* Background vector - Always stays on the right */}
      <Image
        src={vector14}
        alt={t("vectorLine")}
        className="absolute right-0 top-0 h-full w-full object-cover block opacity-80"
        style={{ 
          position: 'absolute',
          right: '0',
          top: '0',
          zIndex: 1,
          transform: 'none',
          direction: 'ltr', // Force LTR for this element
          left: 'auto' // Ensure left is not set
        }}
      />

      {/* Two-column layout */}
      <div className="flex flex-col lg:flex-row gap-8 items-center lg:justify-between justify-center h-full relative z-10 lg:gap-6">
        {/* Logo - Always stays on the left */}
        <div 
          className="flex justify-center items-center lg:flex-1"
          style={{
            order: 1 // Ensure logo always comes first (left side)
          }}
        >
          <Image
            ref={logoRef}
            priority
            src={image1}
            alt={t("logo")}
            width={200}
            height={80}
            className="w-35 sm:w-28 md:w-40 lg:w-96 h-auto"
          />
        </div>

        {/* Burger menu + Language Switcher - Always stays on the right */}
        <div 
          className="absolute top-6 right-6 flex flex-row items-end gap-3 z-[99999]"
          style={{
            position: 'absolute',
            top: '1.5rem',
            right: '1.5rem',
            left: 'auto', // Ensure left is not set
            zIndex: 99999,
            direction: 'ltr' // Force LTR for this element
          }}
        >
          {/* Language Switcher */}
          <LanguageSwitcher showLabels={false} />
          
          {/* Burger */}
          <BurgerMenu isOpen={isMenuOpen} setIsOpen={setIsMenuOpen} />
        </div>

        {/* Text Content - Only text moves for RTL */}
        <div 
          key={`text-content-${currentLanguage}`} 
          className="flex flex-col lg:flex-1 relative lg:gap-4 lg:items-center"
          style={{
            order: 2, // Ensure text always comes second (right side)
            direction: 'ltr' // Always LTR for container positioning
          }}
        >
          <div key={`text-container-${currentLanguage}`} className="flex flex-col lg:justify-center lg:flex-1 relative lg:gap-0 lg:items-center" dir={currentRTL ? 'rtl' : 'ltr'} style={{ direction: currentRTL ? 'rtl' : 'ltr' }}>
            <h3
              ref={addTextRef}
              className={`uppercase text-white text-5xl sm:text-2xl md:text-4xl lg:text-8xl xl:text-[8rem]`}
              style={{ 
                direction: currentRTL ? 'rtl' : 'ltr', 
                textAlign: 'center',
                unicodeBidi: 'normal',
                textJustify: 'inter-word',
                wordSpacing: 'normal',
                writingMode: 'horizontal-tb'
              }}
            >
              {t("siteTitle")}
            </h3>
            <h3 className={`block text-sm sm:text-base md:text-[1.55rem] text-secondary mt-4 font-bold`} style={{ 
              direction: currentRTL ? 'rtl' : 'ltr', 
              textAlign: 'center',
              unicodeBidi: 'normal',
              textJustify: 'inter-word',
              wordSpacing: 'normal',
              writingMode: 'horizontal-tb'
            }}>
              {t("memberStatesPortal")} <br />
              <span className="text-white">{t("poweredBy")}</span>{" "}
              <span className="text-secondary">{t("hiveFlow")}</span>
            </h3>
          </div>  

          <p
            ref={addTextRef}
            className={`text-white text-opacity-70 text-xs sm:text-sm md:text-base lg:text-2xl mt-8 
                        max-w-md`}
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
            {t("takePartStrategy")}
          </p>
        </div>
      </div>

      {/* Scroll Lottie Animation */}
      {!isMenuOpen && (
        <div className="absolute opacity-30 hover:opacity-100 transition-opacity duration-300 bottom-8 left-1/2 -translate-x-1/2 cursor-pointer z-20" onClick={handleScrollDown}>
          <Lottie animationData={scrollDownAnimation} loop={true} className="w-[100px] h-18" />
        </div>
      )}
    </main>
  )
}

export default About
