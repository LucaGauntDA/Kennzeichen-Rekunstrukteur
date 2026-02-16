
import React, { useState, useCallback } from 'react';
import { PlateParameters, SurfaceType, FontType } from './types';
import Controls from './components/Controls';
import PlatePreview from './components/PlatePreview';

const INITIAL_PARAMS: PlateParameters = {
  width: 520,
  height: 110,
  backgroundColor: '#FFFFFF',
  surface: SurfaceType.GLATT,
  borderActive: false,
  borderColor: '#000000',
  borderThickness: 2,
  fontType: FontType.FE,
  fontColor: '#000000',
  letterSpacing: 0,
  text: 'B AUM 123',
  forceUppercase: true,
  textPositionX: 0,
  textPositionY: 0,
  euStripActive: true,
  euStripColor: '#003399',
  euCountryCode: 'D',
  euStarsActive: true,
  rightStripActive: false,
  rightStripColor: '#FF0000',
  rightStripWidth: 20,
};

const App: React.FC = () => {
  const [params, setParams] = useState<PlateParameters>(INITIAL_PARAMS);

  const handleParamChange = useCallback(<K extends keyof PlateParameters>(key: K, value: PlateParameters[K]) => {
    setParams(prev => ({ ...prev, [key]: value }));
  }, []);

  return (
    <div className="flex flex-col md:flex-row h-screen overflow-hidden bg-slate-50">
      {/* Mobile Sticky Preview Header */}
      <div className="md:hidden sticky top-0 z-30 w-full bg-slate-900 p-4 border-b border-white/10 flex items-center justify-center shadow-lg h-32 overflow-hidden">
        <div className="relative z-10 w-full flex justify-center scale-90 sm:scale-100">
           <PlatePreview params={params} />
        </div>
      </div>

      {/* Main Container */}
      <div className="flex flex-col md:flex-row flex-1 overflow-hidden relative">
        
        {/* Sidebar Controls */}
        <aside className="w-full md:w-[400px] bg-white border-r border-slate-200 overflow-y-auto z-20 pb-12 md:pb-6">
          <div className="p-6">
            <header className="mb-8 border-b border-slate-100 pb-4">
              <h1 className="text-xl font-bold text-slate-800">PlateConfig</h1>
              <p className="text-xs text-slate-500 font-mono uppercase tracking-wider">Deterministischer Visualisierer</p>
            </header>
            
            <Controls params={params} onChange={handleParamChange} />
          </div>
        </aside>

        {/* Desktop Preview Area */}
        <main className="hidden md:flex flex-1 items-center justify-center p-8 overflow-hidden relative bg-slate-100">
          <div className="z-10 max-w-full max-h-full flex flex-col items-center gap-8 drop-shadow-2xl">
              <PlatePreview params={params} />
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
