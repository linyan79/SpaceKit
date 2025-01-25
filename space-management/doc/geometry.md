# 几何算法说明

## 基础几何

### 点和向量
```typescript
// 点的基本运算
function distanceBetweenPoints(p1: Point, p2: Point): number;
function midpoint(p1: Point, p2: Point): Point;
function isPointEqual(p1: Point, p2: Point, tolerance?: number): boolean;

// 向量运算
function vectorAdd(v1: Point, v2: Point): Point;
function vectorSubtract(v1: Point, v2: Point): Point;
function vectorScale(v: Point, scale: number): Point;
function vectorLength(v: Point): number;
function vectorNormalize(v: Point): Point;
function dotProduct(v1: Point, v2: Point): number;
```

### 线段运算
```typescript
// 线段相交检测
function lineIntersection(
  line1Start: Point,
  line1End: Point,
  line2Start: Point,
  line2End: Point
): Point | null;

// 点到线段的距离
function pointToLineDistance(
  point: Point,
  lineStart: Point,
  lineEnd: Point
): number;

// 点是否在线段上
function isPointOnLine(
  point: Point,
  lineStart: Point,
  lineEnd: Point,
  tolerance?: number
): boolean;
```

## 墙体几何

### 墙体相交
```typescript
// 墙体相交检测
interface WallIntersection {
  point: Point;
  type: 'T' | 'L' | 'X';
  walls: string[];
}

function findWallIntersections(walls: WallElement[]): WallIntersection[];

// 处理墙体连接
function processWallConnections(walls: WallElement[]): WallElement[];
```

### 墙体操作
```typescript
// 墙体分割
function splitWall(wall: WallElement, point: Point): WallElement[];

// 墙体合并
function mergeWalls(wall1: WallElement, wall2: WallElement): WallElement | null;

// 墙体延伸
function extendWall(wall: WallElement, length: number, direction: 'start' | 'end'): WallElement;
```

## 空间计算

### 区域计算
```typescript
// 计算封闭区域
interface Area {
  points: Point[];
  walls: string[];
  area: number;
}

function findEnclosedAreas(walls: WallElement[]): Area[];

// 计算面积
function calculateArea(points: Point[]): number;
```

### 房间识别
```typescript
// 识别房间
interface Room {
  id: string;
  walls: string[];
  area: number;
  center: Point;
}

function detectRooms(walls: WallElement[]): Room[];
```

## 图元操作

### 选择检测
```typescript
// 点选检测
function hitTest(point: Point, element: BaseElement): boolean;

// 框选检测
function isElementInRect(
  element: BaseElement,
  rect: { start: Point; end: Point }
): boolean;
```

### 图元变换
```typescript
// 移动图元
function moveElement(element: BaseElement, offset: Point): BaseElement;

// 旋转图元
function rotateElement(
  element: BaseElement,
  center: Point,
  angle: number
): BaseElement;

// 缩放图元
function scaleElement(
  element: BaseElement,
  center: Point,
  scale: Point
): BaseElement;
```

## 捕捉系统

### 点捕捉
```typescript
interface SnapPoint {
  point: Point;
  type: 'endpoint' | 'midpoint' | 'intersection' | 'perpendicular' | 'grid';
  sourceId?: string;
}

// 查找捕捉点
function findSnapPoints(
  point: Point,
  elements: BaseElement[],
  tolerance: number
): SnapPoint[];
```

### 对齐捕捉
```typescript
interface AlignmentGuide {
  type: 'horizontal' | 'vertical';
  position: number;
  elements: string[];
}

// 查找对齐参考线
function findAlignmentGuides(
  element: BaseElement,
  elements: BaseElement[],
  tolerance: number
): AlignmentGuide[];
```

## 3D几何

### 3D变换
```typescript
// 2D到3D转换
function convert2DTo3D(point: Point, height: number): Point3D;

// 3D旋转
function rotate3D(point: Point3D, rotation: Rotation): Point3D;

// 3D缩放
function scale3D(point: Point3D, scale: Point3D): Point3D;
```

### 3D碰撞检测
```typescript
// 射线相交检测
function raycast(
  origin: Point3D,
  direction: Point3D,
  elements: BaseElement[]
): {
  element: BaseElement;
  point: Point3D;
  distance: number;
}[];

// 包围盒碰撞检测
function boundingBoxIntersect(box1: BoundingBox, box2: BoundingBox): boolean;
``` 