import { SpaceElement } from './space';

export interface Point {
  x: number;
  y: number;
}

export interface WallPoint extends Point {
  connections?: string[];
}

export interface SnapPoint extends Point {
  type: 'endpoint' | 'center' | 'projection';
  wallId?: string;
  distance?: number;
}

export interface WallProperties {
  type: 'straight' | 'arc';
  thickness: number;
  isGlass?: boolean;
  startPoint: Point;  // 墙体起点
  endPoint: Point;    // 墙体终点
  connections: {
    start: WallConnection[];  // 起点连接的墙体
    end: WallConnection[];    // 终点连接的墙体
  };
  // 弧形墙特有属性
  radius?: number;
  startAngle?: number;
  endAngle?: number;
  centerPoint?: Point;  // 弧形墙的圆心
}

// 墙体图元
export interface WallElement extends SpaceElement {
  type: 'wall';
  properties: WallProperties;
}

export interface WallConnection {
  wallId: string;        // 连接的墙体ID
  point: Point;          // 连接点
  type: 'start' | 'end'; // 连接在起点还是终点
}

export interface WallJoint {
  point: Point;
  walls: {
    wallId: string;
    thickness: number;
    angle: number;
  }[];
}

export interface SnapConfig {
  enabled: boolean;
  snapDistance: number;
  snapToGrid: boolean;
  gridSize: number;
  snapToWalls: boolean;
  snapToEndpoints: boolean;
  snapToMidpoints: boolean;
} 