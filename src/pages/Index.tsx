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
      uColor1: { value: new THREE.Color("#D3E4FD") },
      uColor2: { value: new THREE.Color("#ffffff") },
      uColor3: { value: new THREE.Color("#33C3F0") }
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
        
        // Create grid pattern displacement
        float gridSize = 20.0;
        vec3 pos = position;
        float xGrid = sin(pos.x * gridSize);
        float yGrid = sin(pos.y * gridSize);
        float zGrid = sin(pos.z * gridSize);
        
        // Create dynamic displacement based on audio
        float audioDisplacement = 0.0;
        for(int i = 0; i < 32; i++) {
          float freq = uAudioData[i];
          audioDisplacement += sin(position.y * 5.0 + uTime + float(i)) * freq * 0.2;
        }
        
        // Combine grid and audio displacement
        vec3 gridDisplacement = normal * (xGrid * yGrid * zGrid * 0.02);
        vec3 newPosition = position + gridDisplacement + normal * audioDisplacement;
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
        // Create dynamic wave pattern based on audio
        float audioIntensity = 0.0;
        for(int i = 0; i < 32; i++) {
          audioIntensity += uAudioData[i];
        }
        audioIntensity = audioIntensity / 32.0;
        
        // Enhanced grid pattern
        float gridPattern = abs(sin(vPosition.x * 20.0) * sin(vPosition.y * 20.0) * sin(vPosition.z * 20.0));
        
        float wave = sin(vPosition.y * 5.0 + uTime) * 0.5 + 0.5;
        wave = wave + audioIntensity + gridPattern * 0.3;
        
        // Enhanced gradient from bottom to top with grid influence
        float gradient = smoothstep(-1.0, 1.0, vPosition.y + gridPattern * 0.2);
        
        // More dramatic color mixing based on audio and grid
        vec3 color1 = mix(uColor1, uColor3, wave * audioIntensity * 2.0 + gridPattern * 0.5);
        vec3 color = mix(color1, uColor2, gradient);
        
        // Enhanced rim lighting with grid influence
        float rimLight = 1.0 - max(0.0, dot(vNormal, vec3(0.0, 0.0, 1.0)));
        rimLight = pow(rimLight, 2.0) * (0.5 + audioIntensity + gridPattern * 0.3);
        color = mix(color, uColor2, rimLight);
        
        // Dynamic opacity based on audio and grid
        float opacity = 0.9 - (wave * 0.2) * (1.0 - gradient) + audioIntensity * 0.2 + gridPattern * 0.1;
        
        gl_FragColor = vec4(color, opacity);
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
      
      // More dramatic rotation based on audio intensity
      const avgAudio = audioData.reduce((a, b) => a + b, 0) / audioData.length;
      meshRef.current.rotation.y += 0.001 + avgAudio * 0.01;
      meshRef.current.rotation.x += 0.0005 + avgAudio * 0.005;
    }
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[1, 128, 128]} />
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
        autoRotate={true}
        autoRotateSpeed={0.5}
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
            <h1 className="text-3xl md:text-4xl font-light text-gray-700 tracking-wide">
              Audio Reactive Sphere
            </h1>
            <p className="text-sm md:text-md text-gray-500 mt-1">
              An interactive sound visualization
            </p>
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
