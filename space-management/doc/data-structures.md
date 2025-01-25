# 数据结构说明

## 核心数据类型

### 基础类型
```typescript
interface Point {
  x: number;
  y: number;
}

interface Point3D extends Point {
  z: number;
}

interface Size {
  width: number;
  height: number;
}

interface Rotation {
  x: number;
  y: number;
  z: number;
}
```

### 图元基类
```typescript
interface BaseElement {
  id: string;
  type: ElementType;
  position: Point;
  rotation: number;
  version: number;
  createdAt: string;
  updatedAt: string;
  properties: Record<string, any>;
  style?: ElementStyle;
}

type ElementType = 'wall' | 'seat' | 'door' | 'window' | 'meetingRoom';
```

### 墙体图元
```typescript
interface WallElement extends BaseElement {
  type: 'wall';
  startPoint: Point;
  endPoint: Point;
  thickness: number;
  height: number;
  properties: WallProperties;
}

interface WallProperties {
  material?: string;
  color?: string;
  texture?: string;
}
```

### 座位图元
```typescript
interface SeatElement extends BaseElement {
  type: 'seat';
  size: Size;
  properties: SeatProperties;
}

interface SeatProperties {
  occupant?: string;
  department?: string;
  status: 'vacant' | 'occupied';
}
```

### 门窗图元
```typescript
interface DoorElement extends BaseElement {
  type: 'door';
  width: number;
  height: number;
  openDirection: 'left' | 'right';
}

interface WindowElement extends BaseElement {
  type: 'window';
  width: number;
  height: number;
  sillHeight: number;
}
```

## 状态管理

### Space状态
```typescript
interface SpaceState {
  elements: BaseElement[];
  selectedElements: string[];
  viewMode: ViewMode;
  gridSettings: GridSettings;
}

interface ViewMode {
  mode: '2d' | '3d';
  camera?: CameraSettings;
}

interface GridSettings {
  enabled: boolean;
  size: number;
  snap: boolean;
}
```

### 命令系统
```typescript
interface Command {
  type: CommandType;
  element?: BaseElement;
  previousElement?: BaseElement;
  elements?: BaseElement[];
}

type CommandType = 
  | 'ADD_ELEMENT'
  | 'UPDATE_ELEMENT'
  | 'DELETE_ELEMENT'
  | 'BATCH_DELETE_ELEMENTS'
  | 'ROTATE_ELEMENT';
```

### 文件系统
```typescript
interface SpaceFile {
  id: string;
  name: string;
  userId: string;
  content: {
    elements: BaseElement[];
  };
  createdAt: string;
  updatedAt: string;
}

interface FileListItem {
  id: string;
  name: string;
  updatedAt: string;
}
```

## 样式系统

### 图元样式
```typescript
interface ElementStyle {
  DEFAULT: string;
  HOVER: string;
  SELECTED: string;
  BORDER_DEFAULT?: string;
  BORDER_SELECTED?: string;
}

interface ElementColors {
  WALL: ElementStyle;
  SEAT: ElementStyle;
  DOOR: ElementStyle;
  WINDOW: ElementStyle;
  MEETING_ROOM: ElementStyle;
}
```

### 材质系统
```typescript
interface Material {
  id: string;
  name: string;
  type: 'color' | 'texture';
  value: string;
  properties?: MaterialProperties;
}

interface MaterialProperties {
  roughness?: number;
  metalness?: number;
  opacity?: number;
  map?: string;
  normalMap?: string;
}
```
