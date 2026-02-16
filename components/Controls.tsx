
import React, { useState } from 'react';
import { PlateParameters, SurfaceType, FontType } from '../types';

interface ControlsProps {
  params: PlateParameters;
  onChange: <K extends keyof PlateParameters>(key: K, value: PlateParameters[K]) => void;
}

const ResetIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 12"/>
    <path d="M3 3v9h9"/>
  </svg>
);

const Controls: React.FC<ControlsProps> = ({ params, onChange }) => {
  const [isDownloading, setIsDownloading] = useState(false);
  
  const handleDownloadPNG = async () => {
    const svgElement = document.getElementById('plate-preview-svg');
    if (!svgElement) return;

    setIsDownloading(true);

    try {
        // 1. Serialize SVG
        const serializer = new XMLSerializer();
        let svgString = serializer.serializeToString(svgElement);
        
        // 2. Determine active font URL to embed
        let fontUrl = '';
        if (params.fontType === FontType.FE) {
            fontUrl = "https://raw.githubusercontent.com/LucaGauntDA/fe/main/EuroPlate.ttf";
        } else if (params.fontType === FontType.DIN) {
            fontUrl = "https://raw.githubusercontent.com/LucaGauntDA/fe/main/DIN1451.ttf";
        }

        // 3. Fetch font and convert to Base64 (Flattening)
        if (fontUrl) {
            try {
                const response = await fetch(fontUrl);
                const blob = await response.blob();
                const reader = new FileReader();
                
                await new Promise((resolve) => {
                    reader.onloadend = () => resolve(null);
                    reader.readAsDataURL(blob);
                });
                
                // reader.result contains "data:application/octet-stream;base64,..."
                // We need to inject this into the SVG string, replacing the external URL
                const base64Font = reader.result as string;
                svgString = svgString.replace(fontUrl, base64Font);
            } catch (e) {
                console.error("Font embedding failed, proceeding with fallback", e);
            }
        }
        
        // 4. Scale factor for high resolution PNG (4x standard size)
        const scaleFactor = 4;
        const width = params.width * scaleFactor;
        const height = params.height * scaleFactor;

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            setIsDownloading(false);
            return;
        }

        const img = new Image();
        const svgBlob = new Blob([svgString], {type: 'image/svg+xml;charset=utf-8'});
        const url = URL.createObjectURL(svgBlob);

        img.onload = () => {
            ctx.drawImage(img, 0, 0, width, height);
            URL.revokeObjectURL(url);
            
            const pngUrl = canvas.toDataURL('image/png');
            const downloadLink = document.createElement('a');
            const safeText = params.text.replace(/[^a-zA-Z0-9]/g, '_');
            downloadLink.href = pngUrl;
            downloadLink.download = `kennzeichen_${safeText}.png`;
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
            setIsDownloading(false);
        };
        
        img.onerror = () => {
             console.error("Image loading failed");
             setIsDownloading(false);
        }

        img.src = url;

    } catch (err) {
        console.error("Download process failed", err);
        setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-8 pb-10">
      {/* Abmessungen */}
      <section>
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 border-b pb-1">1. Abmessungen (mm)</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1 uppercase">Breite</label>
            <div className="flex gap-2">
                <input 
                type="number" 
                value={params.width} 
                onChange={e => onChange('width', Number(e.target.value))}
                className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
                <button
                    onClick={() => onChange('width', 520)}
                    title="Zurücksetzen auf 520mm"
                    className="w-12 h-12 flex items-center justify-center bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-blue-600 hover:border-blue-300 transition-all shrink-0"
                >
                    <ResetIcon />
                </button>
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1 uppercase">Höhe</label>
            <div className="flex gap-2">
                <input 
                type="number" 
                value={params.height} 
                onChange={e => onChange('height', Number(e.target.value))}
                className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
                <button
                    onClick={() => onChange('height', 110)}
                    title="Zurücksetzen auf 110mm"
                    className="w-12 h-12 flex items-center justify-center bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-blue-600 hover:border-blue-300 transition-all shrink-0"
                >
                    <ResetIcon />
                </button>
            </div>
          </div>
        </div>
      </section>

      {/* Hintergrund */}
      <section>
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 border-b pb-1">2. Hintergrund</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1 uppercase">Farbe & Finish</label>
            <div className="flex gap-2">
                <input 
                    type="color" 
                    value={params.backgroundColor} 
                    onChange={e => onChange('backgroundColor', e.target.value)}
                    className="w-12 h-12 border-none rounded-lg p-0 bg-transparent cursor-pointer shadow-inner shrink-0"
                />
                <input 
                    type="text" 
                    value={params.backgroundColor} 
                    onChange={e => onChange('backgroundColor', e.target.value)}
                    className="flex-1 h-12 px-4 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono uppercase tracking-wider"
                />
            </div>
          </div>
          <select 
            value={params.surface} 
            onChange={e => onChange('surface', e.target.value as SurfaceType)}
            className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium appearance-none"
          >
            {Object.values(SurfaceType).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </section>

      {/* Rahmen */}
      <section>
        <div className="flex justify-between items-center mb-4 border-b pb-1">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">3. Rahmen</h3>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                  type="checkbox" 
                  checked={params.borderActive} 
                  onChange={e => onChange('borderActive', e.target.checked)}
                  className="sr-only peer"
                  id="border-toggle"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
        </div>
        {params.borderActive && (
          <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200 p-4 bg-slate-50 rounded-xl">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Farbe</label>
                <input 
                  type="color" 
                  value={params.borderColor} 
                  onChange={e => onChange('borderColor', e.target.value)}
                  className="w-full h-10 border-none rounded-lg p-0 bg-transparent cursor-pointer"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Dicke (px)</label>
                <div className="flex gap-2">
                    <input 
                    type="number" 
                    value={params.borderThickness} 
                    onChange={e => onChange('borderThickness', Number(e.target.value))}
                    className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-sm font-medium"
                    />
                     <button
                        onClick={() => onChange('borderThickness', 2)}
                        title="Zurücksetzen auf 2px"
                        className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-blue-600 hover:border-blue-300 transition-all shrink-0"
                    >
                        <ResetIcon />
                    </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Schrift */}
      <section>
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 border-b pb-1">4. Schrift</h3>
        <div className="space-y-6">
          <select 
            value={params.fontType} 
            onChange={e => onChange('fontType', e.target.value as FontType)}
            className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium"
          >
            {Object.values(FontType).map(f => <option key={f} value={f}>{f}</option>)}
          </select>
          
          <div>
            <div className="flex justify-between items-end mb-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase">Zeichenabstand</label>
                <div className="flex items-center gap-2">
                    {params.letterSpacing !== 0 && (
                        <button 
                            onClick={() => onChange('letterSpacing', 0)}
                            className="text-slate-400 hover:text-blue-600 transition-colors p-1"
                            title="Zurücksetzen"
                        >
                            <ResetIcon />
                        </button>
                    )}
                    <span className="text-xs font-mono text-blue-600 font-bold">{params.letterSpacing}</span>
                </div>
            </div>
            <input 
              type="range" 
              min="-10" max="50" step="1"
              value={params.letterSpacing} 
              onChange={e => onChange('letterSpacing', Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>
        </div>
      </section>

      {/* Textinhalt */}
      <section>
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 border-b pb-1">5. Textinhalt</h3>
        <div className="space-y-4">
          <input 
            type="text" 
            value={params.text} 
            onChange={e => onChange('text', e.target.value)}
            className="w-full h-14 px-4 bg-slate-50 border border-slate-200 rounded-xl text-lg font-bold tracking-widest text-center focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="TEXT EINGEBEN"
          />
          <div className="flex items-center gap-3">
            <input 
              type="checkbox" 
              checked={params.forceUppercase} 
              onChange={e => onChange('forceUppercase', e.target.checked)}
              id="force-up"
              className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="force-up" className="text-sm font-medium text-slate-600">Großbuchstaben erzwingen</label>
          </div>
          
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-2 uppercase text-center">Positionierung</label>
            <div className="grid grid-cols-1 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                {/* X Axis */}
                <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold text-slate-400 w-4">X</span>
                    <input 
                        type="range" 
                        min="-200" max="200" step="1"
                        value={params.textPositionX} 
                        onChange={e => onChange('textPositionX', Number(e.target.value))}
                        className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                    <button 
                        onClick={() => onChange('textPositionX', 0)}
                        className="px-2 py-1 text-[10px] bg-white border border-slate-200 text-slate-600 rounded hover:bg-slate-50 transition-colors uppercase font-bold min-w-[30px]"
                    >
                        0
                    </button>
                </div>
                {/* Y Axis */}
                <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold text-slate-400 w-4">Y</span>
                    <input 
                        type="range" 
                        min="-50" max="50" step="1"
                        value={params.textPositionY} 
                        onChange={e => onChange('textPositionY', Number(e.target.value))}
                        className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                    <button 
                        onClick={() => onChange('textPositionY', 0)}
                        className="px-2 py-1 text-[10px] bg-white border border-slate-200 text-slate-600 rounded hover:bg-slate-50 transition-colors uppercase font-bold min-w-[30px]"
                    >
                        0
                    </button>
                </div>
            </div>
          </div>
        </div>
      </section>

      {/* EU Streifen */}
      <section>
        <div className="flex justify-between items-center mb-4 border-b pb-1">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">6. EU-Streifen</h3>
            <input 
                type="checkbox" 
                checked={params.euStripActive} 
                onChange={e => onChange('euStripActive', e.target.checked)}
                className="w-6 h-6 rounded border-slate-300 text-blue-600"
            />
        </div>
        {params.euStripActive && (
          <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200 p-4 bg-slate-50 rounded-xl">
             <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Land</label>
                    <input 
                        type="text" 
                        maxLength={3}
                        value={params.euCountryCode} 
                        onChange={e => onChange('euCountryCode', e.target.value.toUpperCase())}
                        className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-sm font-bold text-center"
                    />
                  </div>
                  <div className="flex items-center gap-2 pt-5">
                    <input 
                        type="checkbox" 
                        checked={params.euStarsActive} 
                        onChange={e => onChange('euStarsActive', e.target.checked)}
                        id="eu-stars"
                        className="w-5 h-5 rounded"
                    />
                    <label htmlFor="eu-stars" className="text-[11px] font-bold text-slate-600 uppercase">Sterne</label>
                  </div>
              </div>
          </div>
        )}
      </section>

      <div className="pt-8 space-y-3">
          <button 
            onClick={handleDownloadPNG}
            disabled={isDownloading}
            className={`w-full h-14 text-white rounded-xl font-bold text-sm shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2 ${isDownloading ? 'bg-slate-600 cursor-wait' : 'bg-slate-800 hover:bg-slate-900'}`}
          >
            {isDownloading ? (
                <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                RENDERING...
                </>
            ) : (
                <>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                PNG SPEICHERN
                </>
            )}
          </button>
      </div>
    </div>
  );
};

export default Controls;
