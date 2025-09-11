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
  const { isRTL } = useI18n()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const containerRef = useRef<HTMLElement>(null)
  const logoRef = useRef<HTMLImageElement>(null)
  const textRefs = useRef<HTMLDivElement[]>([])

  useEffect(() => {
    const ctx = gsap.context(() => {
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

      gsap.fromTo(
        textRefs.current,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 1.2, stagger: 0.3, ease: "power3.out", delay: 0.4 }
      )
    }, containerRef)

    return () => ctx.revert()
  }, [])

const handleScrollDown = () => {
  const nextSection = document.querySelector("#next-section");
  if (nextSection) {
    nextSection.scrollIntoView({ behavior: "smooth" });
  }
};
  return (
    <main
      ref={containerRef}
      id="about"
      className="bg-[#00797d] h-screen relative w-full px-5 sm:px-8 md:px-12 lg:px-20 xl:px-32 overflow-hidden"
    >
      {/* Background vector */}
      <Image
        src={vector14}
        alt={t("vectorLine")}
        className="absolute right-0 top-0 h-full w-full object-cover block opacity-80"
      />

      {/* Two-column layout */}
      <div className="flex flex-col lg:flex-row gap-8 items-center lg:justify-between justify-center h-full relative z-10 lg:gap-6">
        {/* Left: Logo */}
        <div className="flex justify-center items-center lg:flex-1">
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

        {/* Burger menu */}
        {/* Burger menu + Language Switcher */}
        <div className="absolute top-6 right-6 flex flex-row-reverse items-end gap-3 z-50">
          {/* Burger */}
          <BurgerMenu isOpen={isMenuOpen} setIsOpen={setIsMenuOpen} />

          {/* Language Switcher */}
        
        </div>



        {/* Right: Text */}
        <div className="flex flex-col items-center lg:items-start lg:flex-1 relative lg:gap-4">
          <div className="flex flex-col lg:justify-center items-center lg:items-end lg:flex-1 relative lg:gap-0">
            <h4
              ref={(el) => { if (el) textRefs.current.push(el); }}
              className={`uppercase text-white text-center lg:${isRTL ? 'text-start' : 'text-end'}
                        text-5xl sm:text-2xl md:text-4xl lg:text-8xl xl:text-8xl`}
            >
              ICESCO
            </h4>
            <h4 className={`block text-sm sm:text-base md:text-xl text-center lg:${isRTL ? 'text-start' : 'text-end'} text-secondary mt-1 font-bold`}>
              {t("memberStatesPortal")} <br />
              <span className="text-white">{t("poweredBy")}</span>{" "}
              <span className="text-secondary">{t("hiveFlow")}</span>
            </h4>
          </div>

          <p
            ref={(el) => { if (el) textRefs.current.push(el); }}
            className={`text-white text-opacity-70 text-xs sm:text-sm md:text-base lg:text-2xl mt-8 
                        max-w-md text-center lg:${isRTL ? 'text-right' : 'text-left'}`}
          >
            {t("takePartStrategy")}
          </p>
        </div>
      </div>

      {/* Scroll Lottie Animation */}
      {!isMenuOpen && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 cursor-pointer z-20" onClick={handleScrollDown}>
          <Lottie animationData={scrollDownAnimation} loop={true} className="w-18 h-18" />
        </div>
      )}
    </main>
  )
}

export default About
