
import { useEffect, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, useTexture } from "@react-three/drei";
import * as THREE from "three";

// Sphere component with shader material
const FluidSphere = () => {
  // Reference to the mesh for animations
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const time = useRef(0);
  
  // Custom shader for the wave effect
  const shaderMaterial = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uColor1: { value: new THREE.Color("#D3E4FD") },
      uColor2: { value: new THREE.Color("#ffffff") },
      uColor3: { value: new THREE.Color("#33C3F0") }
    },
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vPosition;

      void main() {
        vUv = uv;
        vNormal = normal;
        vPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform vec3 uColor1;
      uniform vec3 uColor2;
      uniform vec3 uColor3;
      
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vPosition;
      
      void main() {
        // Create wave pattern based on y-position and time
        float wave = sin(vPosition.y * 5.0 + uTime * 0.5) * 0.5 + 0.5;
        
        // Create gradient from bottom to top
        float gradient = smoothstep(-1.0, 1.0, vPosition.y);
        
        // Mix the colors based on wave and gradient
        vec3 color1 = mix(uColor1, uColor3, wave * 0.7);
        vec3 color = mix(color1, uColor2, gradient);
        
        // Add rim lighting effect
        float rimLight = 1.0 - max(0.0, dot(vNormal, vec3(0.0, 0.0, 1.0)));
        rimLight = pow(rimLight, 2.0) * 0.5;
        color = mix(color, uColor2, rimLight);
        
        // Add a subtle opacity gradient for translucency
        float opacity = 0.9 - (wave * 0.2) * (1.0 - gradient);
        
        gl_FragColor = vec4(color, opacity);
      }
    `,
    transparent: true,
    side: THREE.DoubleSide,
  });

  // Animation loop
  useFrame((state) => {
    if (meshRef.current && materialRef.current) {
      time.current += 0.01;
      materialRef.current.uniforms.uTime.value = time.current;
      
      // Subtle rotation
      meshRef.current.rotation.y += 0.001;
      meshRef.current.rotation.x += 0.0005;
    }
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[1, 64, 64]} />
      <primitive object={shaderMaterial} ref={materialRef} attach="material" />
    </mesh>
  );
};

// Scene component
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

// Main component
const Index = () => {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Simple loading state
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
              Ethereal Marble
            </h1>
            <p className="text-sm md:text-md text-gray-500 mt-1">
              An interactive fluid sphere visualization
            </p>
          </div>
          <div className="w-full h-full">
            <Canvas dpr={[1, 2]} gl={{ alpha: true, antialias: true }}>
              <Scene />
              <PerspectiveCamera makeDefault fov={50} position={[0, 0, 3]} />
            </Canvas>
          </div>
          <div className="absolute bottom-6 left-0 w-full text-center text-gray-500 text-sm">
            Click and drag to rotate | Scroll to zoom
          </div>
        </>
      )}
    </div>
  );
};

export default Index;
