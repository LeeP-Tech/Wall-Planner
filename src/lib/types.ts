export type Alignment = 'centered' | 'left-aligned';
export type LayoutMode = 'linear' | 'circular' | 'hub-spoke' | 'staircase' | 'splat';
export type UnitSystem = 'metric' | 'imperial';
export type AccuracyStepMm = 10 | 5 | 2 | 1;

export interface WallConfig {
  width: number;
  height: number;
  /** Vertical anchor (distance up from bottom) used to center linear/jagged row layouts */
  centerHeightAt: number;
  defaultGutter: number;
  rowGutter: number;
  alignment: Alignment;
  /** Only used when alignment === 'left-aligned' */
  startOffset: number;
}

export interface ItemDef {
  id: string;
  name: string;
  width: number;
  height: number;
  row: number;
  holeCount: number;
  /** Distance between holes (only relevant when holeCount > 1) */
  holeSpacing: number;
  /** Horizontal offset of the hole cluster from item centre; 0 = centred */
  holeOffset: number;
  /** Vertical offset of the hole cluster from item centre; 0 = centred */
  holeVerticalOffset?: number;
  /** Overrides WallConfig.defaultGutter for the gap BEFORE this item */
  gutterBefore?: number;
}

export interface CircularLayoutParams {
  centerX: number;
  centerY: number;
  radius: number;
  startAngleDeg: number;
}

export interface HubSpokeLayoutParams {
  centerX: number;
  centerY: number;
  radius: number;
}

export interface StaircaseLayoutParams {
  xStep: number;
  yStep: number;
  /** 'ltr' = left-to-right ascent (default); 'rtl' = right-to-left descent */
  direction: 'ltr' | 'rtl';
}

export interface SplatLayoutParams {
  /** Seed for the deterministic pseudo-random scatter */
  seed: number;
}

export type LayoutParams = {
  circular: CircularLayoutParams;
  'hub-spoke': HubSpokeLayoutParams;
  staircase: StaircaseLayoutParams;
  splat: SplatLayoutParams;
};

export interface WallDef {
  id: string;
  name: string;
  config: WallConfig;
  items: ItemDef[];
  layoutMode: LayoutMode;
  layoutParams: LayoutParams;
}

export interface ProjectDef {
  id: string;
  name: string;
  wall: WallDef;
  schemaVersion: number;
  unitSystem: UnitSystem;
  accuracyStepMm: AccuracyStepMm;
  updatedAt: string;
}

/** Computed position for a single drill hole */
export interface HoleResult {
  itemId: string;
  itemName: string;
  holeIndex: number;    // 0-based within item
  fromLeft: number;
  fromRight: number;
  fromTop: number;
  fromBottom: number;
  /** Signed: negative = left of wall centre */
  fromCenter: number;
  /** Signed: negative = above wall centre */
  fromVerticalCenter: number;
  /** Distance to the next hole within the same item; undefined for last hole */
  distToNextHole?: number;
}

export interface ItemPosition {
  itemId: string;
  x: number;
  y: number;
}

export interface Connector {
  fromItemId: string;
  toItemId: string;
}

export interface LayoutResult {
  holes: HoleResult[];
  itemPositions: ItemPosition[];
  connectors?: Connector[];
  totalSpan: number;
  startX: number;
  /** true if items overflow the wall */
  overflow: boolean;
}
