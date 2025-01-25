import { SpaceElement, Point, WallElement, SeatElement, DoorElement, WindowElement } from '../types';
import { WallProperties } from '../types/wall';

// 图元高亮颜色配置
export const ELEMENT_COLORS = {
  WALL: {
    DEFAULT: '#D3D3D3',
    HOVER: '#4A9AFF',
    SELECTED: '#FF9632',
  },
  SEAT: {
    DEFAULT: 'transparent',
    HOVER: 'rgba(24, 144, 255, 0.1)',
    SELECTED: 'rgba(255, 150, 50, 0.1)',
    BORDER_DEFAULT: '#1890ff',
    BORDER_SELECTED: '#ff4d4f',
  },
  DOOR: {
    DEFAULT: '#E8E8E8',
    HOVER: '#BAE7FF',
    SELECTED: '#FFC069',
  },
  WINDOW: {
    DEFAULT: '#F0F0F0',
    HOVER: '#91D5FF',
    SELECTED: '#FFD591',
  },
  MEETING_ROOM: {
    DEFAULT: '#F5F5F5',
    HOVER: '#ADC6FF',
    SELECTED: '#FFB37B',
  },
};

// 判断点是否在矩形内
export const isPointInRect = (point: Point, rect: { start: Point; end: Point }) => {
  const minX = Math.min(rect.start.x, rect.end.x);
  const maxX = Math.max(rect.start.x, rect.end.x);
  const minY = Math.min(rect.start.y, rect.end.y);
  const maxY = Math.max(rect.start.y, rect.end.y);
  
  return point.x >= minX && point.x <= maxX && point.y >= minY && point.y <= maxY;
};

// 判断线段是否与矩形相交
export const isLineIntersectRect = (start: Point, end: Point, rect: { start: Point; end: Point }) => {
  const minX = Math.min(rect.start.x, rect.end.x);
  const maxX = Math.max(rect.start.x, rect.end.x);
  const minY = Math.min(rect.start.y, rect.end.y);
  const maxY = Math.max(rect.start.y, rect.end.y);

  // 检查线段的端点是否在矩形内
  if (isPointInRect(start, rect) || isPointInRect(end, rect)) return true;

  // 检查线段是否与矩形的四条边相交
  const lines = [
    { start: { x: minX, y: minY }, end: { x: maxX, y: minY } }, // 上边
    { start: { x: maxX, y: minY }, end: { x: maxX, y: maxY } }, // 右边
    { start: { x: maxX, y: maxY }, end: { x: minX, y: maxY } }, // 下边
    { start: { x: minX, y: maxY }, end: { x: minX, y: minY } }  // 左边
  ];

  return lines.some(line => {
    const x1 = start.x, y1 = start.y;
    const x2 = end.x, y2 = end.y;
    const x3 = line.start.x, y3 = line.start.y;
    const x4 = line.end.x, y4 = line.end.y;

    const denominator = ((x2 - x1) * (y4 - y3)) - ((y2 - y1) * (x4 - x3));
    if (denominator === 0) return false;

    const ua = (((x4 - x3) * (y1 - y3)) - ((y4 - y3) * (x1 - x3))) / denominator;
    const ub = (((x2 - x1) * (y1 - y3)) - ((y2 - y1) * (x1 - x3))) / denominator;

    return ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1;
  });
};

// 判断图元是否被选中（框选）
export const isElementSelected = (element: SpaceElement, selectionBox: { start: Point; end: Point; isLeftToRight: boolean }) => {
  if (!selectionBox) return false;

  if (element.type === 'wall') {
    const wall = element.properties as WallProperties;
    if (wall.type === 'straight') {
      // 左上到右下框选时，只选择完全在框内的墙
      if (selectionBox.isLeftToRight) {
        return isPointInRect(wall.startPoint, selectionBox) && 
               isPointInRect(wall.endPoint, selectionBox);
      }
      // 其他方向框选时，相交也选中
      return isPointInRect(wall.startPoint, selectionBox) || 
             isPointInRect(wall.endPoint, selectionBox) ||
             isLineIntersectRect(wall.startPoint, wall.endPoint, selectionBox);
    } else if (wall.type === 'arc' && wall.centerPoint && wall.radius && wall.startAngle !== undefined && wall.endAngle !== undefined) {
      // 弧形墙判断起点和终点
      const startPoint = {
        x: wall.centerPoint.x + wall.radius * Math.cos(wall.startAngle * Math.PI / 180),
        y: wall.centerPoint.y + wall.radius * Math.sin(wall.startAngle * Math.PI / 180)
      };
      const endPoint = {
        x: wall.centerPoint.x + wall.radius * Math.cos(wall.endAngle * Math.PI / 180),
        y: wall.centerPoint.y + wall.radius * Math.sin(wall.endAngle * Math.PI / 180)
      };
      if (selectionBox.isLeftToRight) {
        return isPointInRect(startPoint, selectionBox) && 
               isPointInRect(endPoint, selectionBox);
      }
      return isPointInRect(startPoint, selectionBox) || 
             isPointInRect(endPoint, selectionBox);
    }
  } else {
    // 对于其他图元，判断中心点是否在选择框内
    if (selectionBox.isLeftToRight) {
      return isPointInRect(element.position, selectionBox);
    }
    return isPointInRect(element.position, selectionBox);
  }
  return false;
};

// 获取图元的高亮颜色
export const getElementColor = (
  element: SpaceElement,
  isSelected: boolean,
  isHovered: boolean
): string => {
  const colors = (() => {
    switch (element.type) {
      case 'wall':
        return ELEMENT_COLORS.WALL;
      case 'seat':
        return ELEMENT_COLORS.SEAT;
      case 'door':
        return ELEMENT_COLORS.DOOR;
      case 'window':
        return ELEMENT_COLORS.WINDOW;
      case 'meetingRoom':
        return ELEMENT_COLORS.MEETING_ROOM;
      default:
        return ELEMENT_COLORS.WALL; // 默认使用墙体颜色
    }
  })();

  if (isSelected) return colors.SELECTED;
  if (isHovered) return colors.HOVER;
  return colors.DEFAULT;
}; 