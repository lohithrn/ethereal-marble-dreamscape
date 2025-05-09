import { useEffect, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";
import { useAudioAnalyzer } from "../hooks/useAudioAnalyzer";

const FluidSphere = () => {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const time = useRef(0);
  const { audioData, isCapturing } = useAudioAnalyzer();
  
  const shaderMaterial = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uAudioData: { value: new Float32Array(32) },
      uColor1: { value: new THREE.Color("#33C3F0") },
      uColor2: { value: new THREE.Color("#FEF7CD") },
      uColor3: { value: new THREE.Color("#1EAEDB") }
    },
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vPosition;
      uniform float uTime;
      uniform float uAudioData[32];

      void main() {
        vUv = uv;
        vNormal = normal;
        
        float audioDisplacement = 0.0;
        for(int i = 0; i < 32; i++) {
          float freq = uAudioData[i];
          audioDisplacement += sin(position.y * 5.0 + uTime + float(i)) * freq * 0.2;
        }
        
        vec3 newPosition = position + normal * audioDisplacement;
        vPosition = newPosition;
        
        gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform float uAudioData[32];
      uniform vec3 uColor1;
      uniform vec3 uColor2;
      uniform vec3 uColor3;
      
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vPosition;
      
      void main() {
        float audioIntensity = 0.0;
        for(int i = 0; i < 32; i++) {
          audioIntensity += uAudioData[i];
        }
        audioIntensity = audioIntensity / 32.0;
        
        float wave = sin(vPosition.y * 5.0 + uTime) * 0.5 + 0.5;
        wave = wave + audioIntensity;
        
        float gradient = smoothstep(-1.0, 1.0, vPosition.y);
        
        vec3 color1 = mix(uColor1, uColor3, wave * audioIntensity * 2.0);
        vec3 color2 = mix(color1, uColor2, gradient);
        
        float rimLight = 1.0 - max(0.0, dot(vNormal, vec3(0.0, 0.0, 1.0)));
        rimLight = pow(rimLight, 2.0) * (0.5 + audioIntensity);
        color2 = mix(color2, uColor2, rimLight);
        
        float opacity = 0.9 - (wave * 0.2) * (1.0 - gradient) + audioIntensity * 0.2;
        
        gl_FragColor = vec4(color2, opacity);
      }
    `,
    transparent: true,
    side: THREE.DoubleSide,
  });

  useFrame((state) => {
    if (meshRef.current && materialRef.current) {
      time.current += 0.01;
      materialRef.current.uniforms.uTime.value = time.current;
      materialRef.current.uniforms.uAudioData.value = audioData;
      
      const avgAudio = audioData.reduce((a, b) => a + b, 0) / audioData.length;
      meshRef.current.rotation.y += 0.001 + avgAudio * 0.01;
      meshRef.current.rotation.x += 0.0005 + avgAudio * 0.005;
    }
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[0.5, 128, 128]} />
      <primitive object={shaderMaterial} ref={materialRef} attach="material" />
    </mesh>
  );
};

const Scene = () => {
  const { camera } = useThree();
  
  useEffect(() => {
    camera.position.z = 3;
  }, [camera]);

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

const Index = () => {
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
                  Audio Reactive Sphere
                </h1>
                <p className="text-sm md:text-md text-gray-500 mt-1">
                  An interactive sound visualization
                </p>
              </div>
              <a 
                href="/droplet" 
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
              >
                Try Droplet
              </a>
            </div>
          </div>
          <div className="w-full h-full">
            <Canvas dpr={[1, 2]} gl={{ alpha: true, antialias: true }}>
              <Scene />
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

export default Index;
