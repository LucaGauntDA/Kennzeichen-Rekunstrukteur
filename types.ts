
export enum SurfaceType {
  GLATT = 'glatt',
  GLAENZEND = 'leicht glänzend'
}

export enum FontType {
  FE = 'FE-Schrift (Standard)',
  DIN = 'DIN 1451'
}

export enum UncertaintyStatus {
  SICHER = 'sicher',
  UNSICHER = 'unsicher',
  GERATEN = 'geraten'
}

export interface PlateParameters {
  // Dimensions
  width: number;
  height: number;

  // Background
  backgroundColor: string;
  surface: SurfaceType;

  // Border
  borderActive: boolean;
  borderColor: string;
  borderThickness: number;

  // Font
  fontType: FontType;
  fontColor: string;
  letterSpacing: number;

  // Content
  text: string;
  forceUppercase: boolean;
  textPositionX: number; // 0 = centered
  textPositionY: number; // 0 = default baseline
  
  // EU Strip (Left)
  euStripActive: boolean;
  euStripColor: string;
  euCountryCode: string;
  euStarsActive: boolean;

  // Right Strip
  rightStripActive: boolean;
  rightStripColor: string;
  rightStripWidth: number;

  // Status
  status?: UncertaintyStatus;
}
