export type Alignment = 'centered' | 'left-aligned';

export interface WallConfig {
  width: number;
  defaultGutter: number;
  alignment: Alignment;
  /** Only used when alignment === 'left-aligned' */
  startOffset: number;
}

export interface ItemDef {
  id: string;
  name: string;
  width: number;
  holeCount: number;
  /** Distance between holes (only relevant when holeCount > 1) */
  holeSpacing: number;
  /** Horizontal offset of the hole cluster from item centre; 0 = centred */
  holeOffset: number;
  /** Overrides WallConfig.defaultGutter for the gap BEFORE this item */
  gutterBefore?: number;
}

/** Computed position for a single drill hole */
export interface HoleResult {
  itemId: string;
  itemName: string;
  holeIndex: number;    // 0-based within item
  fromLeft: number;
  fromRight: number;
  /** Signed: negative = left of wall centre */
  fromCenter: number;
  /** Distance to the next hole within the same item; undefined for last hole */
  distToNextHole?: number;
}

export interface LayoutResult {
  holes: HoleResult[];
  /** x position of left edge of each item (same order as input) */
  itemStartPositions: number[];
  totalSpan: number;
  startX: number;
  /** true if items overflow the wall */
  overflow: boolean;
}
