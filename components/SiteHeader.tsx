"use client"
import { useEffect, useRef } from "react"
import { gsap } from "gsap"
import { ScrollToPlugin } from "gsap/ScrollToPlugin"
import Image from "next/image"
import { ChevronDown } from "lucide-react"
import vector14 from "@/public/about.png"
import image1 from "@/public/Logo-01.svg"
import BurgerMenu from "./BurgerMenu"

gsap.registerPlugin(ScrollToPlugin)

const About = () => {
  const containerRef = useRef<HTMLElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const scrollIconRef = useRef<HTMLDivElement>(null)
  const logoRef = useRef<HTMLImageElement>(null)
  const textRefs = useRef<HTMLDivElement[]>([])

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Logo animation (fade, slide, scale)
      gsap.fromTo(
        logoRef.current,
        { opacity: 0, y: 40, scale: 0.9 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 1.4,
          ease: "power3.out",
        }
      )

      // Floating effect on logo (infinite subtle movement)
      gsap.to(logoRef.current, {
        y: "+=8",
        duration: 3,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        delay: 1.6,
      })

      // Stagger text animation
      gsap.fromTo(
        textRefs.current,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 1.2,
          stagger: 0.3,
          ease: "power3.out",
          delay: 0.4,
        }
      )

      // Scroll icon fade-in
      gsap.fromTo(
        scrollIconRef.current,
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          delay: 1.5,
          ease: "power2.out",
        }
      )

      // Bounce scroll icon
      gsap.to(scrollIconRef.current, {
        y: "+=10",
        duration: 1.5,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        delay: 2,
      })
    }, containerRef)

    return () => ctx.revert()
  }, [])

const handleScrollDown = () => {
  const nextSection = document.querySelector("#next-section");
  if (nextSection) {
    const offsetTop = (nextSection as HTMLElement).offsetTop;
    gsap.to(window, {
      duration: 0,
      scrollTo: { y: offsetTop, offsetY: 0 },
      ease: "power3.inOut",
    });
  }
};
  

  return (
    <main
      ref={containerRef}
      id="about"
      className="bg-primary h-screen mt-0 sm:py-14 relative w-full px-5 md:px-[1.9rem] largesceen:px-14 fourk:px-44"
    >

      
      {/* Background vector image (keep visible as in your version) */}
      <Image
        src={vector14 || "/placeholder.svg"}
        alt="vector-line"
        className="absolute right-0 top-0 h-full max-lg:hidden overflow-hidden"
      />

      <div
        ref={contentRef}
        className="desktop:pt-24 flex flex-col lg:flex-row justify-between relative z-10"
      >
        {/* Left empty space (kept as in your original) */}
        <div className="flex flex-col justify-between items-center">
           {/* Burger Menu in top right corner */}
       <div className="absolute top-4 right-4 z-50 focus:outline-none">
        <BurgerMenu />
      </div>
          <div className="w-18 h-48 hidden xl:block"></div>
        </div>

        {/* Main Logo */}
        <div>
          <Image
            ref={logoRef}
            priority
            src={image1 || "/placeholder.svg"}
            alt="Logo"
            width={250}
            height={100}
          />
        </div>

        {/* Text Section */}
        <div className="flex flex-col justify-end gap-24 relative max-lg:mt-4">
          <h1
           ref={(el) => {
  if (el) textRefs.current.push(el)
}}
            className="lg:translate-y-20 lg:-translate-x-56 desktop:-translate-x-40 largesceen:translate-x-0 md:text-[6.25rem] desktop:text-[7.813rem] largesceen:text-[9.375rem] text-white-100 leading-none text-right w-fit uppercase max-lg:hidden"
          >
            <span className="block">ICESCO</span>
            <span className="text-[32px] text-secondary leading-none block mt-2 gap-2">
              Member States Portal
              <br />
             <span className="text-white"> Powered by</span> <span className="text-secondary">HiveFlow</span>
            </span>
            <h3 className="text-[32px] desktop:text-text-[32px] largesceen:text-text-[32px] text-white-100 tracking-[0.094rem] mb-8 w-fit capitalize">
             
            </h3>
          </h1>

          <div
             ref={(el) => { if (el) textRefs.current.push(el) }}
            className="sm:ml-10 lg:ml-24 desktop:ml-0 relative "
          >
          
            <p className="text-white-100 text-[1.813rem] desktop:text-base 2xl:text-3xl leading-[155.556%] w-[95%] sm:w-[80%] lg:w-[400px] text-justify desktop:w-[52rem]  leading-[155.556%] text-opacity-[0.64] ">
              Take part in shaping the 2026–2030 Strategy by sharing your project proposals. Your needs and priorities
              set the vision and drive impact across the Islamic world and beyond.
            </p>
          </div>
        </div>

        {/* Right empty space (kept as in your original) */}
        <div className="flex flex-col justify-between items-center">
          <div className="w-48 h-48 hidden xl:block"></div>
        </div>
      </div>

      {/* Scroll icon */}
      <div
        ref={scrollIconRef}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20"
      >
        <button
          onClick={handleScrollDown}
          className="flex flex-col items-center gap-2 text-secondary group"
          aria-label="Scroll down"
        >
          <span className="text-2xl font-light tracking-wider">Scroll Down</span>
          <div className="w-14 h-14 border border-secondary rounded-full flex items-center justify-center group-hover:border-secondary transition">
            <ChevronDown className="w-8 h-8" />
          </div>
        </button>
      </div>
    </main>
  )
}

export default About
