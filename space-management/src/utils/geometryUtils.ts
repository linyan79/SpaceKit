import { SpaceElement } from '../types/space';
import { Point, WallProperties } from '../types/wall';

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

  // 如果线段的两个端点都在矩形的同一侧，则不相交
  if ((start.x < minX && end.x < minX) || (start.x > maxX && end.x > maxX) ||
      (start.y < minY && end.y < minY) || (start.y > maxY && end.y > maxY)) {
    return false;
  }

  // 如果线段的任一端点在矩形内，则相交
  if (isPointInRect(start, rect) || isPointInRect(end, rect)) {
    return true;
  }

  // 检查线段是否与矩形的四条边相交
  const rectLines = [
    { start: { x: minX, y: minY }, end: { x: maxX, y: minY } }, // 上边
    { start: { x: maxX, y: minY }, end: { x: maxX, y: maxY } }, // 右边
    { start: { x: maxX, y: maxY }, end: { x: minX, y: maxY } }, // 下边
    { start: { x: minX, y: maxY }, end: { x: minX, y: minY } }  // 左边
  ];

  return rectLines.some(line => isLineIntersectLine(start, end, line.start, line.end));
};

// 判断两条线段是否相交
const isLineIntersectLine = (start1: Point, end1: Point, start2: Point, end2: Point) => {
  const denominator = ((end1.x - start1.x) * (end2.y - start2.y)) - ((end1.y - start1.y) * (end2.x - start2.x));
  if (denominator === 0) return false;

  const ua = (((end2.x - start2.x) * (start1.y - start2.y)) - ((end2.y - start2.y) * (start1.x - start2.x))) / denominator;
  const ub = (((end1.x - start1.x) * (start1.y - start2.y)) - ((end1.y - start1.y) * (start1.x - start2.x))) / denominator;

  return ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1;
};

// 计算点到线段的最短距离
export function pointToLineDistance(point: Point, lineStart: Point, lineEnd: Point): number {
  const A = point.x - lineStart.x;
  const B = point.y - lineStart.y;
  const C = lineEnd.x - lineStart.x;
  const D = lineEnd.y - lineStart.y;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let param = -1;

  if (lenSq !== 0) {
    param = dot / lenSq;
  }

  let xx, yy;

  if (param < 0) {
    xx = lineStart.x;
    yy = lineStart.y;
  } else if (param > 1) {
    xx = lineEnd.x;
    yy = lineEnd.y;
  } else {
    xx = lineStart.x + param * C;
    yy = lineStart.y + param * D;
  }

  const dx = point.x - xx;
  const dy = point.y - yy;

  return Math.sqrt(dx * dx + dy * dy);
}

// 计算墙体的角度（相对于x轴）
export function getWallAngle(wall: SpaceElement): number {
  const properties = wall.properties as WallProperties;
  if (properties.type !== 'straight') return 0;
  
  const dx = properties.endPoint.x - properties.startPoint.x;
  const dy = properties.endPoint.y - properties.startPoint.y;
  return Math.atan2(dy, dx);
}

// 找到最近的墙体
export function findNearestWall(seat: SpaceElement, walls: SpaceElement[]): SpaceElement | null {
  let nearestWall = null;
  let minDistance = Infinity;

  for (const wall of walls) {
    if (wall.type !== 'wall') continue;
    const properties = wall.properties as WallProperties;
    if (properties.type !== 'straight') continue;

    const distance = pointToLineDistance(
      seat.position,
      properties.startPoint,
      properties.endPoint
    );

    if (distance < minDistance) {
      minDistance = distance;
      nearestWall = wall;
    }
  }

  return nearestWall;
}

// 计算座位到最近墙体的距离是否小于阈值
export function isNearWall(seat: SpaceElement, walls: SpaceElement[]): boolean {
  const { width, depth } = seat.dimensions;
  const threshold = Math.sqrt((width * width + depth * depth)) * 2 / 3; // 修改为2/3对角线距离

  const nearestWall = findNearestWall(seat, walls);
  if (!nearestWall) return false;

  const properties = nearestWall.properties as WallProperties;
  const distance = pointToLineDistance(
    seat.position,
    properties.startPoint,
    properties.endPoint
  );

  return distance < threshold;
}

// 计算下一个合法的旋转角度
export function getNextRotation(seat: SpaceElement, walls: SpaceElement[]): number {
  const currentRotation = seat.rotation.z;
  const nearestWall = findNearestWall(seat, walls);

  if (nearestWall && isNearWall(seat, walls)) {
    // 如果靠近墙体，则对齐到墙体的方向
    const wallAngle = getWallAngle(nearestWall);
    const possibleAngles = [
      wallAngle,
      wallAngle + Math.PI / 2,
      wallAngle + Math.PI,
      wallAngle + Math.PI * 1.5
    ];

    // 找到当前最接近的角度
    let currentAngleIndex = 0;
    let minDiff = Math.PI * 2;
    
    possibleAngles.forEach((angle, index) => {
      const normalizedAngle = ((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
      const diff = Math.abs(currentRotation - normalizedAngle);
      if (diff < minDiff) {
        minDiff = diff;
        currentAngleIndex = index;
      }
    });
    
    // 返回下一个角度
    const nextIndex = (currentAngleIndex + 1) % 4;
    return possibleAngles[nextIndex];
  }

  // 如果不靠近墙体，则旋转到正交方向（上下左右）
  const normalizedRotation = ((currentRotation % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
  const orthogonalAngles = [0, Math.PI / 2, Math.PI, Math.PI * 1.5];
  
  // 找到当前最接近的正交角度
  let currentOrthogonalIndex = 0;
  let minDiff = Math.PI * 2;
  
  orthogonalAngles.forEach((angle, index) => {
    const diff = Math.abs(normalizedRotation - angle);
    if (diff < minDiff) {
      minDiff = diff;
      currentOrthogonalIndex = index;
    }
  });
  
  // 返回下一个正交角度
  const nextIndex = (currentOrthogonalIndex + 1) % 4;
  return orthogonalAngles[nextIndex];
} 