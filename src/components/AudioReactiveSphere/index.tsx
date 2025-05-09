
import { useState, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { PerspectiveCamera } from "@react-three/drei";
import { AudioReactiveScene } from "./Scene";

export const AudioReactiveSphere = ({ 
  title = "Audio Reactive Sphere",
  subtitle = "An interactive sound visualization",
  showLink = true,
  linkText = "Try Droplet",
  linkUrl = "/droplet"
}: {
  title?: string;
  subtitle?: string;
  showLink?: boolean;
  linkText?: string;
  linkUrl?: string;
}) => {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="w-full h-screen bg-gray-100 flex flex-col items-center justify-center">
      {!loaded ? (
        <div className="text-center">
          <p className="text-lg text-gray-600">Loading experience...</p>
        </div>
      ) : (
        <>
          <div className="absolute top-0 left-0 w-full p-6 z-10">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl md:text-4xl font-light text-gray-700 tracking-wide">
                  {title}
                </h1>
                <p className="text-sm md:text-md text-gray-500 mt-1">
                  {subtitle}
                </p>
              </div>
              {showLink && (
                <a 
                  href={linkUrl} 
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                >
                  {linkText}
                </a>
              )}
            </div>
          </div>
          <div className="w-full h-full">
            <Canvas dpr={[1, 2]} gl={{ alpha: true, antialias: true }}>
              <AudioReactiveScene />
              <PerspectiveCamera makeDefault fov={50} position={[0, 0, 3]} />
            </Canvas>
          </div>
          <div className="absolute bottom-6 left-0 w-full text-center text-gray-500 text-sm">
            Click and drag to rotate | Scroll to zoom | Allow microphone access
          </div>
        </>
      )}
    </div>
  );
};

export default AudioReactiveSphere;
