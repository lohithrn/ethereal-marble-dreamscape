
import { useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useAudioAnalyzer } from "./hooks/useAudioAnalyzer";

export const FluidSphere = () => {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const time = useRef(0);
  const { audioData, isCapturing } = useAudioAnalyzer();
  
  // Audio-reactive rotation state
  const rotationState = useRef({
    xDirection: 1,
    yDirection: 1,
    zDirection: 0,
    lastDirectionChange: 0,
    directionChangeThreshold: 0.2,  // Audio threshold to trigger direction change
  });
  
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
      
      // Change rotation direction based on audio intensity
      if (avgAudio > rotationState.current.directionChangeThreshold && 
          time.current - rotationState.current.lastDirectionChange > 1.0) {
        
        // Randomly decide which axes to change direction
        if (Math.random() > 0.5) {
          rotationState.current.xDirection = -rotationState.current.xDirection;
        }
        
        if (Math.random() > 0.5) {
          rotationState.current.yDirection = -rotationState.current.yDirection;
        }
        
        // Occasionally add Z-axis rotation for more dynamic movement
        if (Math.random() > 0.7) {
          rotationState.current.zDirection = (Math.random() - 0.5) * 0.5;
        } else {
          rotationState.current.zDirection = 0;
        }
        
        rotationState.current.lastDirectionChange = time.current;
      }
      
      // Apply rotation with dynamic speed based on audio
      meshRef.current.rotation.x += (0.001 + avgAudio * 0.01) * rotationState.current.xDirection;
      meshRef.current.rotation.y += (0.002 + avgAudio * 0.015) * rotationState.current.yDirection;
      
      if (rotationState.current.zDirection !== 0) {
        meshRef.current.rotation.z += rotationState.current.zDirection * avgAudio * 0.01;
      }
    }
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[0.5, 128, 128]} />
      <primitive object={shaderMaterial} ref={materialRef} attach="material" />
    </mesh>
  );
};
