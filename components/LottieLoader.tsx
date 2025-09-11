"use client";
import React from "react";
import Lottie from "lottie-react";
import loadingAnimation from "@/public/loading.json"; // place your Lottie JSON in /public

interface LottieLoaderProps {
  message?: string;
}

const LottieLoader: React.FC<LottieLoaderProps> = ({ message }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <Lottie
        animationData={loadingAnimation}
        loop
        autoplay
        className="w-32 h-32"
      />
    
    </div>
  );
};

export default LottieLoader;
