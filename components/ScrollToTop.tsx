"use client";
import React, { useEffect, useState } from "react";
import Lottie from "lottie-react";
import scrollUpAnimation from "@/public/go-top.json"; // place your Lottie JSON file in /public

const ScrollToTop: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.pageYOffset > 300);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <button
      type="button"
      onClick={scrollToTop}
      className={`fixed right-12 w-16 h-16 flex items-center justify-center rounded-full z-50 transition-all duration-1000 ${
        isVisible
          ? "bottom-8 animate-scroll_amini"
          : "bottom-[-10%] transition-all duration-300"
      }`}
      style={{ transitionProperty: "bottom" }}
    >
      <Lottie
        animationData={scrollUpAnimation}
        loop
        autoplay
        className="w-22 h-22"
      />
    </button>
  );
};

export default ScrollToTop;
