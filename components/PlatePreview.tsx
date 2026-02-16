
import React from 'react';
import { PlateParameters, FontType, SurfaceType } from '../types';

interface PlatePreviewProps {
  params: PlateParameters;
}

const PlatePreview: React.FC<PlatePreviewProps> = ({ params }) => {
  const {
    width,
    height,
    backgroundColor,
    surface,
    borderActive,
    borderColor,
    borderThickness,
    fontType,
    fontColor,
    letterSpacing,
    text,
    forceUppercase,
    textPositionX,
    textPositionY,
    euStripActive,
    euStripColor,
    euCountryCode,
    euStarsActive,
    rightStripActive,
    rightStripColor,
    rightStripWidth
  } = params;

  // Font Selection
  let fontFamily = 'sans-serif';
  let fontWeight = 'normal'; 

  if (fontType === FontType.DIN) {
    fontFamily = '"DIN1451Font", "Roboto Condensed", sans-serif';
    // Use normal weight to rely on the font file's actual thickness and avoid synthetic bolding
    fontWeight = 'normal';
  } else if (fontType === FontType.FE) {
    // Uses the injected @font-face below
    fontFamily = '"FEFontStandard", "Cutive Mono", monospace';
    // FE Font is naturally bold in the TTF file. 
    // Setting it to 'bold' here creates a "synthetic bold" which makes it too thick/bloated.
    fontWeight = 'normal'; 
  }

  const displayText = forceUppercase ? text.toUpperCase() : text;
  const euStripWidth = height * 0.45; // Proportional to height
  
  // Responsive Scaling Logic
  const containerPadding = 32;
  const maxW = window.innerWidth > 768 ? 800 : window.innerWidth - containerPadding;
  const maxH = 300;
  
  const scale = Math.min(maxW / width, maxH / height);
  const displayWidth = width * scale;
  const displayHeight = height * scale;

  // EU Stars Coordinates (12 stars in a circle)
  const renderStars = () => {
    const stars = [];
    const centerX = euStripWidth / 2;
    const centerY = height * 0.35;
    const radius = euStripWidth * 0.25;
    
    for (let i = 0; i < 12; i++) {
        const angle = (i * 30) * (Math.PI / 180);
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);
        stars.push(
            <path 
                key={i} 
                d={`M ${x} ${y-1.5} L ${x+0.4} ${y-0.4} L ${x+1.5} ${y-0.4} L ${x+0.6} ${y+0.3} L ${x+1} ${y+1.4} L ${x} ${y+0.7} L ${x-1} ${y+1.4} L ${x-0.6} ${y+0.3} L ${x-1.5} ${y-0.4} L ${x-0.4} ${y-0.4} Z`} 
                fill="yellow" 
            />
        );
    }
    return stars;
  };

  return (
    <div 
        className="relative transition-all duration-300 rounded overflow-hidden flex-shrink-0 shadow-2xl" 
        style={{ width: displayWidth, height: displayHeight }}
    >
      <svg
        id="plate-preview-svg"
        viewBox={`0 0 ${width} ${height}`}
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full block"
      >
        <defs>
          <linearGradient id="glossyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style={{ stopColor: 'white', stopOpacity: 0.15 }} />
            <stop offset="50%" style={{ stopColor: 'white', stopOpacity: 0.05 }} />
            <stop offset="100%" style={{ stopColor: 'black', stopOpacity: 0.08 }} />
          </linearGradient>

          {/* DIN 1451 Font Injection */}
          {fontType === FontType.DIN && (
             <style type="text/css">
                {`
                    @font-face {
                        font-family: "DIN1451Font";
                        src: url("https://raw.githubusercontent.com/LucaGauntDA/fe/main/DIN1451.ttf") format("truetype");
                    }
                `}
             </style>
          )}

          {/* Standard FE Font Injection (Updated URL) */}
          {fontType === FontType.FE && (
             <style type="text/css">
                {`
                    @font-face {
                        font-family: "FEFontStandard";
                        src: url("https://raw.githubusercontent.com/LucaGauntDA/fe/main/EuroPlate.ttf") format("truetype");
                    }
                `}
             </style>
          )}
        </defs>

        <rect 
            width={width} 
            height={height} 
            fill={backgroundColor} 
            rx={2}
            ry={2}
        />

        {euStripActive && (
          <g>
            <rect width={euStripWidth} height={height} fill={euStripColor} />
            {euStarsActive && renderStars()}
            <text
              x={euStripWidth / 2}
              y={height * 0.88}
              fill="white"
              textAnchor="middle"
              fontFamily="Inter, sans-serif"
              fontWeight="900"
              fontSize={height * 0.22}
            >
              {euCountryCode}
            </text>
          </g>
        )}

        {rightStripActive && (
          <rect 
            x={width - rightStripWidth} 
            width={rightStripWidth} 
            height={height} 
            fill={rightStripColor} 
          />
        )}

        <text
          x={(width / 2) + textPositionX + (euStripActive ? euStripWidth/2 : 0) - (rightStripActive ? rightStripWidth/2 : 0)}
          y={height / 2 + (height * 0.20) + textPositionY}
          textAnchor="middle"
          fill={fontColor}
          fontFamily={fontFamily}
          fontSize={height * 0.72}
          fontWeight={fontWeight}
          letterSpacing={letterSpacing}
        >
          {displayText}
        </text>

        {borderActive && (
          <rect
            x={borderThickness / 2}
            y={borderThickness / 2}
            width={width - borderThickness}
            height={height - borderThickness}
            fill="none"
            stroke={borderColor}
            strokeWidth={borderThickness}
            rx={2}
            ry={2}
          />
        )}

        {surface === SurfaceType.GLAENZEND && (
          <rect width={width} height={height} fill="url(#glossyGradient)" pointerEvents="none" />
        )}
      </svg>
    </div>
  );
};

export default PlatePreview;
