"use client"
import { useState, useEffect, useRef } from "react"
import { useTranslation } from "react-i18next"
import { motion, stagger } from "framer-motion"
import { Home, Folder, LogOut } from "lucide-react"
import { useAuth } from "../context/AuthContext"
import { useRouter } from "next/navigation"

interface BurgerMenuProps {
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
}

// Custom useDimensions hook
const useDimensions = (ref: React.RefObject<HTMLDivElement | null>) => {
  const dimensions = useRef({ width: 0, height: 0 })

  useEffect(() => {
    if (ref.current) {
      dimensions.current.width = ref.current.offsetWidth
      dimensions.current.height = ref.current.offsetHeight
    }
  }, [ref])

  return dimensions.current
}

const BurgerMenu: React.FC<BurgerMenuProps> = ({ isOpen, setIsOpen }) => {
  const { t } = useTranslation("common")
  const { logout } = useAuth()
  const router = useRouter()
  const containerRef = useRef<HTMLDivElement>(null)
  const { height } = useDimensions(containerRef)

  const menuItems = [
    { label: t("home"), href: "/", icon: <Home /> },
    { label: t("myProjects"), href: "/projects", icon: <Folder /> },
  ]

  const handleMenuItemClick = (href: string) => {
    setIsOpen(false)
    setTimeout(() => {
      if (href.startsWith("#")) {
        const element = document.querySelector(href)
        element?.scrollIntoView({ behavior: "smooth" })
      } else {
        router.push(href)
      }
    }, 300)
  }

  const handleLogout = () => {
    setIsOpen(false)
    setTimeout(() => {
      logout()
      router.push("/login")
    }, 300)
  }

  return (
    <div className="relative">
      {/* Burger Button - Only visible when menu is closed */}
      {!isOpen && (
        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          className="relative z-[110] p-2 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all duration-300"
          aria-label="Open menu"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <div className="w-6 h-6 flex flex-col justify-center items-center">
            <div className="w-5 h-0.5 bg-white mb-1" />
            <div className="w-5 h-0.5 bg-white mb-1" />
            <div className="w-5 h-0.5 bg-white" />
          </div>
        </motion.button>
      )}

      {/* Menu Overlay */}
      <motion.nav
        initial={false}
        animate={isOpen ? "open" : "closed"}
        custom={height}
        ref={containerRef}
        className={`fixed inset-0 z-[120] ${isOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}
      >
        <motion.div
          className={`absolute inset-0 bg-gradient-to-br from-[#0f7378] to-[#1B3B36] ${isOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}
          variants={sidebarVariants}
        />
        
        {/* Close Button - Only visible when menu is open */}
        {isOpen && (
          <motion.button
            onClick={() => setIsOpen(false)}
            className="absolute top-6 right-6 z-[130] w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/30 hover:bg-white/30 hover:border-white/50 transition-all duration-300 flex items-center justify-center pointer-events-auto"
            aria-label="Close menu"
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <div className="w-6 h-6 relative">
              <motion.div
                className="absolute top-1/2 left-1/2 w-5 h-0.5 bg-white rounded-full"
                style={{ 
                  transform: 'translate(-50%, -50%) rotate(45deg)',
                  transformOrigin: 'center'
                }}
              />
              <motion.div
                className="absolute top-1/2 left-1/2 w-5 h-0.5 bg-white rounded-full"
                style={{ 
                  transform: 'translate(-50%, -50%) rotate(-45deg)',
                  transformOrigin: 'center'
                }}
              />
            </div>
          </motion.button>
        )}
        
        <div className={isOpen ? 'pointer-events-auto' : 'pointer-events-none'}>
          <Navigation 
            menuItems={menuItems}
            onItemClick={handleMenuItemClick}
            onLogout={handleLogout}
            t={t}
          />
        </div>
      </motion.nav>
    </div>
  )
}

// Animation Variants
const navVariants = {
  open: {
    transition: { 
      delayChildren: 0.2,
      staggerChildren: 0.07
    },
  },
  closed: {
    transition: { 
      delayChildren: 0.05,
      staggerChildren: 0.05
    },
  },
}

const itemVariants = {
  open: {
    y: 0,
    opacity: 1,
    transition: {
      y: { stiffness: 1000, velocity: -100 },
    },
  },
  closed: {
    y: 50,
    opacity: 0,
    transition: {
      y: { stiffness: 1000 },
    },
  },
}

const sidebarVariants = {
  open: (height = 1000) => ({
    clipPath: `circle(${height * 2 + 200}px at calc(100% - 40px) 40px)`,
    transition: {
      type: "spring",
      stiffness: 20,
      restDelta: 2,
    },
  }),
  closed: {
    clipPath: "circle(0px at calc(100% - 40px) 40px)",
    transition: {
      delay: 0.2,
      type: "spring",
      stiffness: 400,
      damping: 40,
    },
  },
}

// Navigation Component
const Navigation = ({ menuItems, onItemClick, onLogout, t }: any) => (
  <motion.ul 
    className="absolute inset-0 flex flex-col items-center justify-center space-y-12"
    variants={navVariants}
  >
    {menuItems.map((item: any, index: number) => (
      <MenuItem 
        key={index}
        item={item}
        index={index}
        onClick={() => onItemClick(item.href)}
      />
    ))}
    
    {/* Logout Button */}
    <MenuItem 
      item={{ label: t("logout"), icon: <LogOut /> }}
      index={menuItems.length}
      onClick={onLogout}
      isLogout={true}
    />
  </motion.ul>
)

// Menu Item Component
const MenuItem = ({ item, index, onClick, isLogout = false }: any) => (
  <motion.li
    className="flex items-center cursor-pointer gap-6"
    variants={itemVariants}
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
  >
    <motion.div
      className={`w-16 h-16 rounded-full flex items-center justify-center ${
        isLogout 
          ? 'border-2 border-[#ecc42d] bg-[#ecc42d]/20' 
          : 'border-2 border-white bg-white/20'
      }`}
      whileHover={{ 
        backgroundColor: isLogout ? '#ecc42d' : '#ecc42d',
        scale: 1.1,
        boxShadow: '0 0 20px rgba(236, 196, 45, 0.4)'
      }}
    >
      <div className={`text-2xl ${isLogout ? 'text-[#ecc42d]' : 'text-white'}`}>
        {item.icon}
      </div>
    </motion.div>
    
    <motion.div
      className={`text-4xl font-light ${
        isLogout ? 'text-[#ecc42d]' : 'text-white'
      }`}
      whileHover={{ 
        color: '#ecc42d',
        scale: 1.02
      }}
    >
      {item.label}
    </motion.div>
  </motion.li>
)

export default BurgerMenu
