
import { useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { FluidSphere } from "./FluidSphere";
import { useAudioAnalyzer } from "./hooks/useAudioAnalyzer";

export interface AudioReactiveSphereProps {
  className?: string;
  title?: string;
  subtitle?: string;
  showInstructions?: boolean;
}

export const AudioReactiveSphere = ({
  className = "w-full h-screen",
  title = "Audio Reactive Sphere",
  subtitle = "An interactive sound visualization",
  showInstructions = true,
}: AudioReactiveSphereProps) => {
  const { isCapturing } = useAudioAnalyzer();

  return (
    <div className={`bg-gray-100 flex flex-col items-center justify-center ${className}`}>
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
        </div>
      </div>
      <div className="w-full h-full">
        <Canvas dpr={[1, 2]} gl={{ alpha: true, antialias: true }}>
          <Scene />
          <PerspectiveCamera makeDefault fov={50} position={[0, 0, 3]} />
        </Canvas>
      </div>
      {showInstructions && (
        <div className="absolute bottom-6 left-0 w-full text-center text-gray-500 text-sm">
          Click and drag to rotate | Scroll to zoom | {isCapturing ? "Audio responding" : "Please allow microphone access"}
        </div>
      )}
    </div>
  );
};

const Scene = () => {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 10]} intensity={0.7} />
      <FluidSphere />
      <OrbitControls 
        enableZoom={true} 
        minDistance={2} 
        maxDistance={5}
        enablePan={false}
        autoRotate={false}
      />
    </>
  );
};

export default AudioReactiveSphere;
