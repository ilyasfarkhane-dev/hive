"use client"
import { useEffect, useRef, useState, useCallback } from "react"
import { gsap } from "gsap"
import { ScrollToPlugin } from "gsap/ScrollToPlugin"
import Image from "next/image"
import Lottie from "lottie-react"
import { useTranslation } from "react-i18next"
import { useI18n } from "@/context/I18nProvider"
import scrollDownAnimation from "@/public/scroll-down.json"
import logoImage from "@/public/Logo-01.svg"
import LanguageSwitcher from "./LanguageSwitcher"
import BurgerMenu from "./BurgerMenu"
import "../styles/siteHeader.css"

gsap.registerPlugin(ScrollToPlugin)

// Types
interface AnimationRefs {
  container: HTMLElement | null
  logo: HTMLImageElement | null
  textElements: HTMLDivElement[]
}

interface SiteHeaderProps {
  className?: string
  showScrollIndicator?: boolean
}

// Constants
const ANIMATION_CONFIG = {
  logo: {
    duration: 1.4,
    ease: "power3.out",
    from: { opacity: 0, y: 40, scale: 0.9 },
    to: { opacity: 1, y: 0, scale: 1 }
  },
  text: {
    duration: 1.2,
    stagger: 0.3,
    delay: 0.4,
    ease: "power3.out",
    from: { opacity: 0, y: 30 },
    to: { opacity: 1, y: 0 }
  },
  logoFloat: {
    duration: 3,
    repeat: -1,
    yoyo: true,
    ease: "sine.inOut",
    delay: 1.6,
    movement: "+=8"
  }
}

const LAYOUT_CONFIG = {
  container: "bg-gradient-to-br from-[#0e7378] to-[#1B3B36] min-h-screen relative overflow-hidden",
  background: {
    className: "absolute inset-0 w-full h-full object-cover opacity-80",
    style: { zIndex: 1 }
  },
  overlay: {
    className: "absolute inset-0 bg-black/40 z-10",
    style: { zIndex: 10 }
  },
  content: {
    className: "relative z-20 flex flex-col lg:flex-row items-center justify-between min-h-screen px-6 sm:px-8 md:px-12 lg:px-16 xl:px-24",
    style: { direction: 'ltr' }
  }
}

// Custom hook for animations
const useGSAPAnimations = (refs: AnimationRefs, isLanguageLoaded: boolean) => {
  useEffect(() => {
    if (!isLanguageLoaded || !refs.container) return

    const ctx = gsap.context(() => {
      // Logo animation
      if (refs.logo) {
        gsap.fromTo(
          refs.logo,
          ANIMATION_CONFIG.logo.from,
          { ...ANIMATION_CONFIG.logo.to, duration: ANIMATION_CONFIG.logo.duration, ease: ANIMATION_CONFIG.logo.ease }
        )

        // Logo floating animation
        gsap.to(refs.logo, {
          y: ANIMATION_CONFIG.logoFloat.movement,
          duration: ANIMATION_CONFIG.logoFloat.duration,
          repeat: ANIMATION_CONFIG.logoFloat.repeat,
          yoyo: ANIMATION_CONFIG.logoFloat.yoyo,
          ease: ANIMATION_CONFIG.logoFloat.ease,
          delay: ANIMATION_CONFIG.logoFloat.delay,
        })
      }

      // Text elements animation
      if (refs.textElements.length > 0) {
        gsap.fromTo(
          refs.textElements,
          ANIMATION_CONFIG.text.from,
          {
            ...ANIMATION_CONFIG.text.to,
            duration: ANIMATION_CONFIG.text.duration,
            stagger: ANIMATION_CONFIG.text.stagger,
            ease: ANIMATION_CONFIG.text.ease,
            delay: ANIMATION_CONFIG.text.delay
          }
        )
      }
    }, refs.container)

    return () => ctx.revert()
  }, [isLanguageLoaded, refs.container, refs.logo, refs.textElements])
}

// Background component
const BackgroundImage = ({ src, alt }: { src: string; alt: string }) => (
  <Image
    src={src}
    alt={alt}
    width={1920}
    height={1080}
    priority
    className={`fixed-background ${LAYOUT_CONFIG.background.className}`}
    style={{
      ...LAYOUT_CONFIG.background.style,
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      zIndex: 1
    }}
  />
)

// Overlay component
const Overlay = () => (
  <div 
    className={LAYOUT_CONFIG.overlay.className}
    style={LAYOUT_CONFIG.overlay.style}
  />
)

// Logo component
const LogoSection = ({ 
  logoRef, 
  logoImage, 
  alt 
}: { 
  logoRef: React.RefObject<HTMLImageElement>
  logoImage: any
  alt: string 
}) => (
  <div className="flex justify-center items-center lg:flex-1 order-1">
    <div className="relative">
      <Image
        ref={logoRef}
        src={logoImage}
        alt={alt}
        width={200}
        height={80}
        priority
        className="w-32 sm:w-40 md:w-48 lg:w-64 xl:w-80 h-auto"
      />
    </div>
  </div>
)

// Header controls (language switcher, menu, etc.)
const HeaderControls = ({ onMenuStateChange }: { onMenuStateChange: (isOpen: boolean) => void }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  
  // Notify parent component when menu state changes
  useEffect(() => {
    onMenuStateChange(isMenuOpen)
  }, [isMenuOpen, onMenuStateChange])
  
  return (
    <div className="absolute top-6 right-6 flex items-center gap-3 z-30">
      {/* Language Switcher - Only visible when menu is closed */}
      {!isMenuOpen && <LanguageSwitcher showLabels={false} />}
      <BurgerMenu isOpen={isMenuOpen} setIsOpen={setIsMenuOpen} />
    </div>
  )
}

// Text content component
const TextContent = ({ 
  currentLanguage, 
  isRTL, 
  addTextRef 
}: { 
  currentLanguage: string
  isRTL: boolean
  addTextRef: (el: HTMLDivElement | null) => void 
}) => {
  const { t } = useTranslation("common")
  
  const textDirection = isRTL ? 'rtl' : 'ltr'
  
  return (
    <div 
      className="flex flex-col lg:flex-1 items-center text-center space-y-6 order-2"
      style={{ direction: 'ltr' }}
    >
      {/* Main title section */}
      <div className="space-y-4">
        <h1
          ref={addTextRef}
          className="title-text uppercase text-white font-bold leading-tight"
          dir={textDirection}
          style={{ 
            direction: textDirection,
            textAlign: 'center'
          }}
        >
          {t("siteTitle")}
        </h1>
        
        <div 
          className="subtitle-text text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold"
          dir={textDirection}
          style={{ direction: textDirection }}
        >
          <span className="text-white/90">{t("memberStatesPortal")}</span>
          <br />
          <span className="text-white/70">{t("poweredBy")} </span>
          <span className="text-[#d19500] font-bold">{t("hiveFlow")}</span>
        </div>
      </div>

      {/* Description */}
      <p
        ref={addTextRef}
        className="text-white/80 text-sm sm:text-base md:text-lg lg:text-xl max-w-2xl leading-relaxed"
        dir={textDirection}
        style={{ 
          direction: textDirection,
          textAlign: 'center'
        }}
      >
        {t("takePartStrategy")}
      </p>
    </div>
  )
}

// Scroll indicator component
const ScrollIndicator = ({ onClick }: { onClick: () => void }) => (
  <div 
    className="scroll-indicator absolute bottom-8 left-1/2 cursor-pointer z-20 opacity-30 hover:opacity-100 transition-opacity duration-300"
    onClick={onClick}
  >
    <Lottie 
      animationData={scrollDownAnimation} 
      loop={true} 
      className="w-20 h-16" 
    />
  </div>
)

// Loading component
const LoadingSpinner = () => (
  <div className="bg-gradient-to-br from-[#0e7378] to-[#1B3B36] min-h-screen flex items-center justify-center">
    <div className="loading-spinner"></div>
  </div>
)

// Main SiteHeader component
const SiteHeader: React.FC<SiteHeaderProps> = ({ 
  className = "", 
  showScrollIndicator = true 
}) => {
  const { t } = useTranslation("common")
  const { isRTL, currentLanguage } = useI18n()
  const [isLanguageLoaded, setIsLanguageLoaded] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  // Refs
  const containerRef = useRef<HTMLElement>(null)
  const logoRef = useRef<HTMLImageElement>(null)
  const textRefs = useRef<HTMLDivElement[]>([])

  // Animation refs object
  const animationRefs: AnimationRefs = {
    container: containerRef.current,
    logo: logoRef.current,
    textElements: textRefs.current
  }
  
  // Add text ref function
  const addTextRef = useCallback((el: HTMLDivElement | null) => {
    if (el && !textRefs.current.includes(el)) {
      textRefs.current.push(el)
    }
  }, [])
  
  // Handle scroll to next section
  const handleScrollDown = useCallback(() => {
    const nextSection = document.querySelector("#next-section")
    if (nextSection) {
      nextSection.scrollIntoView({ behavior: "smooth" })
    }
  }, [])
  
  // Initialize language loading
  useEffect(() => {
    setIsLanguageLoaded(true)
  }, [])

  // Clear text refs when language changes
  useEffect(() => {
    textRefs.current = []
  }, [currentLanguage])

  // Run animations
  useGSAPAnimations(animationRefs, isLanguageLoaded)
  
  // Show loading state
  if (!isLanguageLoaded) {
    return <LoadingSpinner />
  }

  return (
    <main
      ref={containerRef}
      id="about"
      className={`site-header ${LAYOUT_CONFIG.container} ${className}`}
      style={{ direction: 'ltr' as const }}
    >
      {/* Background */}
      <BackgroundImage src="/ice-ban.jpg" alt={t("vectorLine")} />
      
      {/* Overlay */}
      <Overlay />
      
      {/* Main content */}
      <div className={LAYOUT_CONFIG.content.className} style={{ ...LAYOUT_CONFIG.content.style, direction: 'ltr' as const }}>
        {/* Header controls */}
        <HeaderControls onMenuStateChange={setIsMenuOpen} />
        
        {/* Logo section */}
        <LogoSection 
          logoRef={logoRef}
          logoImage={logoImage}
          alt={t("logo")}
        />
        
        {/* Text content */}
        <TextContent 
          currentLanguage={currentLanguage}
          isRTL={isRTL}
          addTextRef={addTextRef}
        />
      </div>

      {/* Scroll indicator */}
      {showScrollIndicator && !isMenuOpen && <ScrollIndicator onClick={handleScrollDown} />}
    </main>
  )
}

export default SiteHeader