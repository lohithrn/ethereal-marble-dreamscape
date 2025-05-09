
import { useEffect, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";
import { useAudioAnalyzer } from "../hooks/useAudioAnalyzer";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const FluidSphere = () => {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const time = useRef(0);
  const { audioData, isCapturing } = useAudioAnalyzer();
  
  const shaderMaterial = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uAudioData: { value: new Float32Array(32) },
      uColor1: { value: new THREE.Color("#8E9196") },  // Medium Grey
      uColor2: { value: new THREE.Color("#D4AF37") },  // Golden
      uColor3: { value: new THREE.Color("#aaadb0") },  // Cool Grey
      uColor4: { value: new THREE.Color("#D4AF37") },  // Golden
    },
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vPosition;
      uniform float uTime;
      uniform float uAudioData[32];

      // Improved noise function for more dramatic effect
      float noise(vec3 p) {
        vec3 i = floor(p);
        vec3 f = fract(p);
        f = f*f*(3.0-2.0*f);
        
        float n = i.x + i.y*57.0 + 113.0*i.z;
        return mix(mix(mix(fract(sin(n+0.0)*43758.5453),
                          fract(sin(n+1.0)*43758.5453), f.x),
                      mix(fract(sin(n+57.0)*43758.5453),
                          fract(sin(n+58.0)*43758.5453), f.x), f.y),
                  mix(mix(fract(sin(n+113.0)*43758.5453),
                          fract(sin(n+114.0)*43758.5453), f.x),
                      mix(fract(sin(n+170.0)*43758.5453),
                          fract(sin(n+171.0)*43758.5453), f.x), f.y), f.z);
      }
      
      void main() {
        vUv = uv;
        vNormal = normal;
        
        // Enhanced audio reactivity
        float audioDisplacement = 0.0;
        float audioSum = 0.0;
        
        for(int i = 0; i < 32; i++) {
          float freq = uAudioData[i];
          audioSum += freq;
          // More complex displacement pattern
          audioDisplacement += sin(position.x * 3.0 + position.y * 5.0 + uTime * 2.0 + float(i)) * freq * 0.4;
          audioDisplacement += cos(position.z * 4.0 + position.y * 2.0 + uTime * 1.5) * freq * 0.3;
        }
        
        // Add noise-based displacement for more organic movement
        float noiseVal = noise(vec3(position.x * 2.0 + uTime * 0.1, position.y * 2.0, position.z * 2.0 + uTime * 0.2));
        audioDisplacement += noiseVal * audioSum * 0.5;
        
        // Apply to normal for more dramatic effect
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
      uniform vec3 uColor4;
      
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vPosition;
      
      void main() {
        // Enhanced audio intensity calculation
        float audioIntensity = 0.0;
        float bassIntensity = 0.0;
        float midIntensity = 0.0;
        float highIntensity = 0.0;
        
        for(int i = 0; i < 8; i++) {
          bassIntensity += uAudioData[i];
        }
        bassIntensity = bassIntensity / 8.0;
        
        for(int i = 8; i < 24; i++) {
          midIntensity += uAudioData[i];
        }
        midIntensity = midIntensity / 16.0;
        
        for(int i = 24; i < 32; i++) {
          highIntensity += uAudioData[i];
        }
        highIntensity = highIntensity / 8.0;
        
        audioIntensity = (bassIntensity + midIntensity + highIntensity) / 3.0;
        
        // More complex wave patterns
        float wave1 = sin(vPosition.x * 8.0 + vPosition.y * 4.0 + uTime * 1.5) * 0.5 + 0.5;
        float wave2 = cos(vPosition.z * 6.0 + vPosition.y * 5.0 + uTime * 1.2) * 0.5 + 0.5;
        float wave = wave1 * 0.6 + wave2 * 0.4;
        
        // Combine with audio for dynamic effect
        wave = wave + audioIntensity * 2.0 + bassIntensity * 3.0;
        
        // Enhanced gradient
        float gradient = smoothstep(-1.0, 1.0, vPosition.y);
        
        // More complex color mixing
        vec3 color = mix(uColor1, uColor2, wave * bassIntensity * 4.0);
        color = mix(color, uColor3, gradient * midIntensity * 3.0);
        color = mix(color, uColor4, highIntensity * highIntensity * 5.0);
        
        // Enhanced rim lighting effect
        float rimLight = 1.0 - max(0.0, dot(normalize(vNormal), vec3(0.0, 0.0, 1.0)));
        rimLight = pow(rimLight, 1.5) * (0.8 + audioIntensity * 2.0);
        color = mix(color, uColor2, rimLight * highIntensity);
        
        // Brighter highlights based on audio
        color += vec3(1.0, 1.0, 1.0) * pow(bassIntensity, 2.0) * 0.5 * wave1;
        
        // Dynamic opacity
        float opacity = 0.9 - (wave * 0.2) * (1.0 - gradient) + audioIntensity * 0.3;
        
        gl_FragColor = vec4(color, opacity);
      }
    `,
    transparent: true,
    side: THREE.DoubleSide,
  });

  useFrame((state) => {
    if (meshRef.current && materialRef.current) {
      // Faster time increment for more dramatic animation
      time.current += 0.015;
      materialRef.current.uniforms.uTime.value = time.current;
      materialRef.current.uniforms.uAudioData.value = audioData;
      
      // Enhanced rotation based on audio frequencies
      const bassAvg = audioData.slice(0, 8).reduce((a, b) => a + b, 0) / 8;
      const midAvg = audioData.slice(8, 24).reduce((a, b) => a + b, 0) / 16;
      const highAvg = audioData.slice(24, 32).reduce((a, b) => a + b, 0) / 8;
      
      meshRef.current.rotation.y += 0.002 + bassAvg * 0.03;
      meshRef.current.rotation.x += 0.001 + midAvg * 0.01;
      meshRef.current.rotation.z += 0.0005 + highAvg * 0.02;
      
      // Subtle pulsing scale based on bass
      const scaleFactor = 1.0 + bassAvg * 0.2;
      meshRef.current.scale.set(scaleFactor, scaleFactor, scaleFactor);
    }
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[0.35, 192, 192]} /> {/* Reduced from 0.4 to 0.35 */}
      <primitive object={shaderMaterial} ref={materialRef} attach="material" />
    </mesh>
  );
};

const Scene = () => {
  const { camera } = useThree();
  
  useEffect(() => {
    camera.position.z = 4.5; // Increased from 3.5 to 4.5 to make sphere appear smaller
  }, [camera]);

  return (
    <>
      <ambientLight intensity={0.2} />
      <directionalLight position={[10, 10, 10]} intensity={1.2} color="#ffffff" />
      <directionalLight position={[-5, -5, 5]} intensity={0.5} color="#D4AF37" />
      <FluidSphere />
      <OrbitControls 
        enableZoom={true} 
        minDistance={3} // Increased minimum distance from 2 to 3
        maxDistance={8} // Increased maximum distance from 6 to 8
        enablePan={false}
        autoRotate={true}
        autoRotateSpeed={0.5}
        rotateSpeed={0.8}
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
    <div className="w-full h-screen bg-white flex flex-col items-center justify-center overflow-hidden">
      {!loaded ? (
        <div className="text-center">
          <p className="text-lg text-gray-400">Loading experience...</p>
        </div>
      ) : (
        <>
          <div className="absolute top-0 left-0 w-full p-6 z-10 bg-gradient-to-b from-white/80 to-transparent">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-gray-600 to-amber-600">
                  Audio Reactive Sphere
                </h1>
                <p className="text-sm md:text-md text-gray-600 mt-1">
                  An interactive sound visualization
                </p>
              </div>
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  className="bg-transparent border border-gray-300 text-gray-700 hover:bg-gray-100"
                  asChild
                >
                  <Link to="/particleShapeChanger">Particle Shape</Link>
                </Button>
                <Button 
                  className="px-4 py-2 bg-gradient-to-r from-gray-600 to-amber-600 text-white rounded-md hover:from-gray-700 hover:to-amber-700 transition-all shadow-lg hover:shadow-amber-500/20"
                  asChild
                >
                  <Link to="/droplet">Try Droplet</Link>
                </Button>
              </div>
            </div>
          </div>
          <div className="w-full h-full">
            <Canvas dpr={[1, 2]} gl={{ alpha: true, antialias: true }}>
              <Scene />
              <PerspectiveCamera makeDefault fov={40} position={[0, 0, 4.5]} /> {/* Reduced FOV further and increased Z position */}
            </Canvas>
          </div>
          <div className="absolute bottom-6 left-0 w-full text-center text-gray-600 text-sm bg-gradient-to-t from-white/80 to-transparent py-6">
            Click and drag to rotate | Scroll to zoom | Allow microphone access for audio reactivity
          </div>
        </>
      )}
    </div>
  );
};

export default Index;
