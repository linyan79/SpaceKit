export type ElementType = 'seat' | 'meetingRoom' | 'door' | 'window' | 'wall';

export interface Position {
  x: number;
  y: number;
  z: number;
}

export interface Rotation {
  x: number;
  y: number;
  z: number;
}

export interface Dimensions {
  width: number;
  height: number;
  depth: number;
}

// 基础图元接口
export interface SpaceElement {
  id: string;
  type: ElementType;
  position: Position;
  rotation: Rotation;
  dimensions: Dimensions;
  properties: Record<string, any>;
}

// 座位图元
export interface SeatElement extends SpaceElement {
  type: 'seat';
  properties: {
    seatNumber: string;
    isOccupied: boolean;
    department?: string;
  };
}

// 门图元
export interface DoorElement extends SpaceElement {
  type: 'door';
  properties: {
    doorType: 'single' | 'double' | 'sliding';
    openDirection: 'left' | 'right';
    isAutomatic: boolean;
  };
}

// 窗图元
export interface WindowElement extends SpaceElement {
  type: 'window';
  properties: {
    windowType: 'fixed' | 'sliding' | 'casement';
    glassType: 'clear' | 'frosted' | 'tinted';
    hasGrills: boolean;
  };
}

// 会议室图元
export interface MeetingRoomElement extends SpaceElement {
  type: 'meetingRoom';
  properties: {
    capacity: number;
    name: string;
    hasDisplay: boolean;
  };
}

// 图元类型联合
export type Element = SeatElement | DoorElement | WindowElement | MeetingRoomElement;

export interface SpaceConfig {
  seatSpacing: number;
  minMeetingRoomSize: {
    width: number;
    length: number;
  };
  corridorWidth: number;
  defaultSeatSize: {
    width: number;
    depth: number;
  };
  collisionThreshold: number;
}

export interface ViewMode {
  mode: '2d' | '3d';
  camera?: {
    position: Position;
    target: Position;
  };
} 