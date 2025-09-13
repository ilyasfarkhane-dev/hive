"use client"
import React, { useRef, useEffect } from "react"
import Link from "next/link"
import { useAuth } from "@/context/AuthContext"
import { useTranslation } from "react-i18next"
import { useI18n } from "@/context/I18nProvider"
import LanguageSwitcher from "./LanguageSwitcher"
import { gsap } from "gsap"
import { X, Home, User, FolderKanban, LogOut } from "lucide-react"

interface BurgerMenuProps {
  isOpen: boolean
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>
}

const BurgerMenu: React.FC<BurgerMenuProps> = ({ isOpen, setIsOpen }) => {
  const menuRef = useRef<HTMLDivElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const { t } = useTranslation("common")
  const { isRTL } = useI18n()
  const { logout } = useAuth()

  useEffect(() => {
    if (menuRef.current && overlayRef.current) {
      if (isOpen) {
        // Lock body scroll when menu is open
        document.body.style.overflow = 'hidden'
        
        gsap.to(menuRef.current, {
          x: 0,
          duration: 0.7,
          ease: "expo.out",
        })
        gsap.to(overlayRef.current, {
          opacity: 1,
          duration: 0.6,
          ease: "power2.out",
          pointerEvents: "auto",
        })
        gsap.fromTo(
          menuRef.current.querySelectorAll(".menu-item"),
          { x: 50, opacity: 0 },
          {
            x: 0,
            opacity: 1,
            duration: 0.5,
            stagger: 0.1,
            delay: 0.2,
            ease: "power3.out",
          }
        )
      } else {
        // Restore body scroll when menu is closed
        document.body.style.overflow = 'unset'
        
        gsap.to(menuRef.current, {
          x: "100%",
          duration: 0.6,
          ease: "power3.in",
        })
        gsap.to(overlayRef.current, {
          opacity: 0,
          duration: 0.5,
          ease: "power2.in",
          pointerEvents: "none",
        })
      }
    }

    // Cleanup function to restore scroll when component unmounts
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  const handleLogout = () => {
    localStorage.clear()
    setIsOpen(false)
    window.location.href = "/login"
  }

  const menuItems = [
    { href: "/", label: t("home"), icon: <Home className="w-5 h-5" /> },
    { href: "/projects", label: t("myProjects"), icon: <FolderKanban className="w-5 h-5" /> },
  ]

  return (
    <div className="relative z-[99999]">
      {/* Toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-md text-white relative z-[100000]"
        aria-label={t("menu")}
      >
        {isOpen ? (
          <X className="w-7 h-7 text-white" />
        ) : (
          <div className="w-6 h-6 flex flex-col justify-between">
            <span className="w-full h-0.5 bg-white"></span>
            <span className="w-full h-0.5 bg-white"></span>
            <span className="w-full h-0.5 bg-white"></span>
          </div>
        )}
      </button>

      {/* Overlay */}
      <div
        ref={overlayRef}
        onClick={() => setIsOpen(false)}
        className="fixed inset-0 bg-black/60 backdrop-blur-md opacity-0 pointer-events-none z-[99998]"
      ></div>

      {/* Sliding Menu */}
      <div
        ref={menuRef}
        className="fixed top-0 right-0 w-full h-screen bg-white/10 backdrop-blur-2xl border-l border-white/20 shadow-2xl translate-x-full z-[99999] flex flex-col items-center justify-center space-y-10 overflow-hidden"
        dir={isRTL ? "rtl" : "ltr"}
      >
        {/* Language Switcher */}
        <div className="absolute top-6 left-6">
          <LanguageSwitcher showLabels={false} />
        </div>

        {/* Menu items */}
        {menuItems.map((item, idx) => (
          <Link
            key={idx}
            href={item.href}
            onClick={() => setIsOpen(false)}
            className="menu-item relative flex items-center gap-3 text-2xl text-white group"
          >
            <span className="opacity-80 group-hover:opacity-100 transition">
              {item.icon}
            </span>
            <span className="relative">
              {item.label}
              <span className="absolute left-0 -bottom-1 w-0 h-0.5 bg-[#fcd144] transition-all duration-300 group-hover:w-full"></span>
            </span>
          </Link>
        ))}

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="menu-item relative flex items-center gap-3 text-2xl text-white group"
        >
          <LogOut className="w-5 h-5 opacity-80 group-hover:opacity-100 transition" />
          <span className="relative">
            {t("logout")}
            <span className="absolute left-0 -bottom-1 w-0 h-0.5 bg-[#fcd144] transition-all duration-300 group-hover:w-full"></span>
          </span>
        </button>
      </div>
    </div>
  )
}

export default BurgerMenu
