
import { useState, useEffect } from 'react';

export const useAudioAnalyzer = () => {
  const [audioData, setAudioData] = useState<number[]>(new Array(32).fill(0));
  const [isCapturing, setIsCapturing] = useState(false);

  useEffect(() => {
    let animationId: number;
    let audioContext: AudioContext;
    let analyzer: AnalyserNode;
    let dataArray: Uint8Array;
    
    const initAudio = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioContext = new AudioContext();
        const source = audioContext.createMediaStreamSource(stream);
        analyzer = audioContext.createAnalyser();
        analyzer.fftSize = 64;
        source.connect(analyzer);
        
        dataArray = new Uint8Array(analyzer.frequencyBinCount);
        
        const updateData = () => {
          analyzer.getByteFrequencyData(dataArray);
          // Normalize the data to a range of 0-1
          setAudioData(Array.from(dataArray).map(value => value / 255));
          animationId = requestAnimationFrame(updateData);
        };
        
        updateData();
        setIsCapturing(true);
      } catch (error) {
        console.error("Error accessing microphone:", error);
        setIsCapturing(false);
      }
    };

    initAudio();

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
      if (audioContext) audioContext.close();
    };
  }, []);

  return { audioData, isCapturing };
};
