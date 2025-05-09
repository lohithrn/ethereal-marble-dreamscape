
# Audio Reactive Sphere

A self-contained, copy-pastable React component that creates an audio-reactive 3D sphere visualization.

## Requirements

This component uses:
- React
- Three.js
- React Three Fiber
- React Three Drei
- TailwindCSS (for styling)

## Installation

1. Copy the entire `AudioReactiveSphere` directory to your project
2. Ensure you have the required dependencies installed:

```bash
npm install three @react-three/fiber @react-three/drei
```

## Usage

Basic usage:

```jsx
import { AudioReactiveSphere, AudioAnalyzerProvider } from './components/AudioReactiveSphere';

const MyApp = () => {
  return (
    <AudioAnalyzerProvider>
      <AudioReactiveSphere />
    </AudioAnalyzerProvider>
  );
};

export default MyApp;
```

With custom props:

```jsx
<AudioAnalyzerProvider>
  <AudioReactiveSphere 
    className="w-full h-[600px]" 
    title="My Custom Sphere" 
    subtitle="React to the beat!" 
    showInstructions={false}
  />
</AudioAnalyzerProvider>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| className | string | "w-full h-screen" | Container CSS classes |
| title | string | "Audio Reactive Sphere" | Title displayed above the sphere |
| subtitle | string | "An interactive sound visualization" | Subtitle text |
| showInstructions | boolean | true | Whether to show usage instructions |

## Microphone Access

This component requires microphone access to analyze audio input. Make sure to:
1. Use HTTPS in production (required for microphone access)
2. Handle user permissions appropriately
