"use client"
import React, { useRef, useEffect } from "react"
import Link from "next/link"
import { useAuth } from "@/context/AuthContext"
import { useTranslation } from "react-i18next"
import LanguageSwitcher from "./LanguageSwitcher"
import { gsap } from "gsap"
import { X } from "lucide-react"

interface BurgerMenuProps {
  isOpen: boolean
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>
}

const BurgerMenu: React.FC<BurgerMenuProps> = ({ isOpen, setIsOpen }) => {
  const menuRef = useRef<HTMLDivElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const { t } = useTranslation("common")
  const { logout } = useAuth()

  // Animate menu + overlay
  useEffect(() => {
    if (menuRef.current && overlayRef.current) {
      if (isOpen) {
        gsap.to(menuRef.current, {
          x: 0,
          duration: 0.6,
          ease: "power3.out",
        })
        gsap.to(overlayRef.current, {
          opacity: 1,
          duration: 0.6,
          ease: "power2.out",
          pointerEvents: "auto",
        })
      } else {
        gsap.to(menuRef.current, {
          x: "100%",
          duration: 0.6,
          ease: "power3.in",
        })
        gsap.to(overlayRef.current, {
          opacity: 0,
          duration: 0.6,
          ease: "power2.in",
          pointerEvents: "none",
        })
      }
    }
  }, [isOpen])

  const handleLogout = () => {
    // Clear all localStorage items
    localStorage.clear();
  
    // Close any UI elements if needed
    setIsOpen(false);
  
    // Redirect to login page
    window.location.href = "/login";
  };
  

  return (
    <div className="relative z-[9999]">
      {/* Burger / Close button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-md text-white relative z-[10001]"
        aria-label={t("menu")}
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <div className="w-6 h-6 flex flex-col justify-between">
            <span className="w-full h-0.5 bg-white"></span>
            <span className="w-full h-0.5 bg-white"></span>
            <span className="w-full h-0.5 bg-white"></span>
          </div>
        )}
      </button>

      {/* Dark blurred overlay */}
      <div
        ref={overlayRef}
        onClick={() => setIsOpen(false)}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm opacity-0 pointer-events-none z-[9998]"
      ></div>

      {/* Sliding blurred menu */}
      <div
        ref={menuRef}
        className="fixed top-0 right-0 w-full h-full 
             bg-white/20 backdrop-blur-lg shadow-xl
             z-[9999] flex flex-col items-center justify-center space-y-8 translate-x-full"
      >


        {/* Language Switcher */}
        <div className="absolute top-6 left-6">
          <LanguageSwitcher showLabels={false} />
        </div>

        {/* Menu Items */}
        <Link
          href="/profile"
          className="text-2xl text-white hover:text-secondary font-medium"
          onClick={() => setIsOpen(false)}
        >
          {t("profile")}
        </Link>
        <Link
          href="/projects"
          className="text-2xl text-white hover:text-secondary font-medium"
          onClick={() => setIsOpen(false)}
        >
          {t("myProjects")}
        </Link>
        <button
          onClick={handleLogout}
          className="text-2xl text-white hover:text-secondary font-medium"
        >
          {t("logout")}
        </button>
      </div>
    </div>
  )
}

export default BurgerMenu
