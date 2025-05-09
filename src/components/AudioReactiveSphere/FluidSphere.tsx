
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useAudioAnalyzer } from "./hooks/useAudioAnalyzer";
import { createShaderMaterial } from "./shaders/fluidSphereShader";

export const FluidSphere = () => {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const time = useRef(0);
  const { audioData } = useAudioAnalyzer();
  
  // Audio-reactive rotation state
  const rotationState = useRef({
    xDirection: 1,
    yDirection: 1,
    zDirection: 0,
    lastDirectionChange: 0,
    directionChangeThreshold: 0.2,  // Audio threshold to trigger direction change
  });
  
  const shaderMaterial = createShaderMaterial();

  useFrame(() => {
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
