
import React, { useEffect, useRef, useState } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Type, FunctionDeclaration } from '@google/genai';
import { PlateParameters, UncertaintyStatus, SurfaceType, FontType } from '../types';

interface LiveAssistantProps {
  onUpdateParameters: (params: Partial<PlateParameters>) => void;
  onClose: () => void;
}

const updatePlateFunction: FunctionDeclaration = {
  name: 'update_plate_parameters',
  parameters: {
    type: Type.OBJECT,
    description: 'Updates one or more parameters of the license plate visualizer.',
    properties: {
      text: { type: Type.STRING, description: 'The text characters shown on the plate' },
      backgroundColor: { type: Type.STRING, description: 'The hex color of the plate background' },
      status: { type: Type.STRING, enum: Object.values(UncertaintyStatus), description: 'The uncertainty status: sicher, unsicher, or geraten' },
      width: { type: Type.NUMBER, description: 'Width in mm' },
      height: { type: Type.NUMBER, description: 'Height in mm' },
      euStripActive: { type: Type.BOOLEAN, description: 'Whether the blue EU strip on the left is visible' },
      euCountryCode: { type: Type.STRING, description: 'The country code like D, F, I' },
      borderActive: { type: Type.BOOLEAN, description: 'Whether the border is visible' },
      fontColor: { type: Type.STRING, description: 'The hex color of the text' }
    }
  }
};

const LiveAssistant: React.FC<LiveAssistantProps> = ({ onUpdateParameters, onClose }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const nextStartTimeRef = useRef<number>(0);

  useEffect(() => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
    const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    audioContextRef.current = outputAudioContext;

    let mediaStream: MediaStream;

    const connect = async () => {
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        const sessionPromise = ai.live.connect({
          model: 'gemini-2.5-flash-native-audio-preview-12-2025',
          callbacks: {
            onopen: () => {
              setIsConnected(true);
              const source = inputAudioContext.createMediaStreamSource(mediaStream);
              const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
              
              scriptProcessor.onaudioprocess = (e) => {
                const inputData = e.inputBuffer.getChannelData(0);
                const pcmBlob = createBlob(inputData);
                sessionPromise.then(session => {
                  session.sendRealtimeInput({ media: pcmBlob });
                });
              };

              source.connect(scriptProcessor);
              scriptProcessor.connect(inputAudioContext.destination);
            },
            onmessage: async (message: LiveServerMessage) => {
              // Handle Audio Output
              const audioBase64 = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
              if (audioBase64) {
                setIsSpeaking(true);
                nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputAudioContext.currentTime);
                const audioBuffer = await decodeAudioData(decode(audioBase64), outputAudioContext, 24000, 1);
                const source = outputAudioContext.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(outputAudioContext.destination);
                source.addEventListener('ended', () => {
                  sourcesRef.current.delete(source);
                  if (sourcesRef.current.size === 0) setIsSpeaking(false);
                });
                source.start(nextStartTimeRef.current);
                nextStartTimeRef.current += audioBuffer.duration;
                sourcesRef.current.add(source);
              }

              // Handle Tool Calls
              if (message.toolCall) {
                for (const fc of message.toolCall.functionCalls) {
                  if (fc.name === 'update_plate_parameters') {
                    onUpdateParameters(fc.args as Partial<PlateParameters>);
                    sessionPromise.then(session => {
                      session.sendToolResponse({
                        functionResponses: [{ id: fc.id, name: fc.name, response: { result: "ok" } }]
                      });
                    });
                  }
                }
              }

              if (message.serverContent?.interrupted) {
                sourcesRef.current.forEach(s => s.stop());
                sourcesRef.current.clear();
                nextStartTimeRef.current = 0;
                setIsSpeaking(false);
              }
            },
            onclose: () => setIsConnected(false),
            onerror: (e) => console.error("Live Assistant Error", e),
          },
          config: {
            responseModalities: [Modality.AUDIO],
            systemInstruction: 'Du bist ein technischer Assistent für einen Kennzeichen-Visualisierer. Du hilfst dem Benutzer, Parameter wie Text, Farbe, Größe und Status per Sprache anzupassen. Sei präzise und effizient. Antworte auf Deutsch.',
            tools: [{ functionDeclarations: [updatePlateFunction] }]
          }
        });

        sessionRef.current = await sessionPromise;
      } catch (err) {
        console.error("Failed to connect to Live Assistant", err);
      }
    };

    connect();

    return () => {
      mediaStream?.getTracks().forEach(t => t.stop());
      inputAudioContext.close();
      outputAudioContext.close();
      sessionRef.current?.close();
    };
  }, [onUpdateParameters]);

  // Encoding/Decoding helpers
  function decode(base64: string) {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
    return bytes;
  }

  async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
    return buffer;
  }

  function encode(bytes: Uint8Array) {
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  }

  function createBlob(data: Float32Array): { data: string; mimeType: string } {
    const int16 = new Int16Array(data.length);
    for (let i = 0; i < data.length; i++) int16[i] = data[i] * 32768;
    return { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' };
  }

  return (
    <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 w-64 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex items-center justify-between mb-4">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`}></span>
          Live Assistant
        </span>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </button>
      </div>
      
      <div className="flex flex-col items-center gap-4 py-4">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${isSpeaking ? 'bg-blue-600 scale-110' : 'bg-slate-100'}`}>
          <div className="flex gap-1 items-center h-4">
             {[0, 1, 2, 3].map(i => (
               <div 
                key={i} 
                className={`w-1 bg-white rounded-full transition-all duration-300 ${isSpeaking ? 'h-full animate-bounce' : 'h-1 bg-slate-300'}`}
                style={{ animationDelay: `${i * 0.1}s` }}
               ></div>
             ))}
          </div>
        </div>
        <p className="text-xs text-slate-500 text-center font-medium">
          {isConnected ? "Ich höre zu... Sag z.B. 'Hintergrund gelb machen'" : "Verbinde..."}
        </p>
      </div>
    </div>
  );
};

export default LiveAssistant;
