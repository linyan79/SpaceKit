import { Point, WallElement } from '../types/wall';

// 计算向量
const createVector = (from: Point, to: Point): Point => ({
  x: to.x - from.x,
  y: to.y - from.y
});

// 计算单位向量
const normalizeVector = (v: Point): Point => {
  const length = Math.sqrt(v.x * v.x + v.y * v.y);
  if (length < 1e-6) return { x: 0, y: 0 };
  return {
    x: v.x / length,
    y: v.y / length
  };
};

// 计算矩形的四个顶点
const calculateRectPoints = (center: Point, vector: Point, width: number, length: number): Point[] => {
  // 计算垂直向量
  const perpVector = { x: -vector.y, y: vector.x };
  
  // 计算四个顶点
  return [
    // 左上
    {
      x: center.x - width/2 * perpVector.x - length * vector.x,
      y: center.y - width/2 * perpVector.y - length * vector.y
    },
    // 右上
    {
      x: center.x + width/2 * perpVector.x - length * vector.x,
      y: center.y + width/2 * perpVector.y - length * vector.y
    },
    // 右下
    {
      x: center.x + width/2 * perpVector.x + length * vector.x,
      y: center.y + width/2 * perpVector.y + length * vector.y
    },
    // 左下
    {
      x: center.x - width/2 * perpVector.x + length * vector.x,
      y: center.y - width/2 * perpVector.y + length * vector.y
    }
  ];
};

// 判断点是否在多边形内部
const isPointInPolygon = (point: Point, polygon: Point[]): boolean => {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y;
    const xj = polygon[j].x, yj = polygon[j].y;
    
    const intersect = ((yi > point.y) !== (yj > point.y))
        && (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
};

// 计算两个多边形的交点
const calculateIntersectionPoints = (poly1: Point[], poly2: Point[]): Point[] => {
  const result: Point[] = [];
  
  // 添加在另一个多边形内部的点
  poly1.forEach(p => {
    if (isPointInPolygon(p, poly2)) {
      result.push(p);
    }
  });
  
  poly2.forEach(p => {
    if (isPointInPolygon(p, poly1)) {
      result.push(p);
    }
  });
  
  // 计算线段交点
  for (let i = 0; i < poly1.length; i++) {
    const i2 = (i + 1) % poly1.length;
    const p1 = poly1[i];
    const p2 = poly1[i2];
    
    for (let j = 0; j < poly2.length; j++) {
      const j2 = (j + 1) % poly2.length;
      const p3 = poly2[j];
      const p4 = poly2[j2];
      
      // 线段相交检测
      const denominator = (p4.y - p3.y) * (p2.x - p1.x) - (p4.x - p3.x) * (p2.y - p1.y);
      if (Math.abs(denominator) < 1e-6) continue;
      
      const ua = ((p4.x - p3.x) * (p1.y - p3.y) - (p4.y - p3.y) * (p1.x - p3.x)) / denominator;
      const ub = ((p2.x - p1.x) * (p1.y - p3.y) - (p2.y - p1.y) * (p1.x - p3.x)) / denominator;
      
      if (ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1) {
        result.push({
          x: p1.x + ua * (p2.x - p1.x),
          y: p1.y + ua * (p2.y - p1.y)
        });
      }
    }
  }
  
  // 按照逆时针顺序排序点
  const center = result.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 });
  center.x /= result.length;
  center.y /= result.length;
  
  return result.sort((a, b) => 
    Math.atan2(a.y - center.y, a.x - center.x) - Math.atan2(b.y - center.y, b.x - center.x)
  );
};

export const calculateConnectionPoints = (jointPoint: Point, walls: WallElement[]) => {
  if (walls.length < 2) return [];

  // 计算每个墙的方向向量（从连接点指向外部）
  const wallVectors = walls.map(wall => {
    if (!wall.properties || !wall.properties.startPoint || !wall.properties.endPoint) {
      console.warn('Invalid wall properties:', wall);
      return { x: 0, y: 0 };
    }

    const isStart = Math.abs(wall.properties.startPoint.x - jointPoint.x) < 1e-6 && 
                   Math.abs(wall.properties.startPoint.y - jointPoint.y) < 1e-6;
    
    const vector = isStart 
      ? createVector(wall.properties.startPoint, wall.properties.endPoint)
      : createVector(wall.properties.endPoint, wall.properties.startPoint);
    
    return normalizeVector(vector);
  });

  if (!walls[0].properties?.thickness || !walls[1].properties?.thickness) {
    console.warn('Missing wall thickness:', walls);
    return [];
  }

  const thickness0 = walls[0].properties.thickness;
  const extendLength0 = thickness0 * 3; // 使用三倍墙体宽度作为延伸长度
  const thickness1 = walls[1].properties.thickness;
  const extendLength1 = thickness1 * 3; // 使用三倍墙体宽度作为延伸长度

  if (walls.length === 2) {
    // 计算两个墙的延伸矩形
    const rect1 = calculateRectPoints(jointPoint, wallVectors[0], thickness0, extendLength0);
    const rect2 = calculateRectPoints(jointPoint, wallVectors[1], thickness1, extendLength1);
    
    // 计算两个矩形的交点，得到连接处的多边形
    return calculateIntersectionPoints(rect1, rect2);
  }
  
  // 其他类型的连接保持不变
  return [];
};

// 更新墙体连接
export const updateWallConnections = (walls: WallElement[]): WallElement[] => {
  return walls.map(wall => {
    // 如果是弧形墙，不处理连接
    if (wall.properties.type === 'arc') {
      return wall;
    }

    // 找到与当前墙相连的其他墙
    const connectedWalls = walls.filter(otherWall => {
      if (otherWall.id === wall.id) return false;
      if (otherWall.properties.type === 'arc') return false;

      // 检查是否有共同端点
      const startPoint = wall.properties.startPoint;
      const endPoint = wall.properties.endPoint;
      const otherStart = otherWall.properties.startPoint;
      const otherEnd = otherWall.properties.endPoint;

      return (
        (Math.abs(startPoint.x - otherStart.x) < 1e-6 && Math.abs(startPoint.y - otherStart.y) < 1e-6) ||
        (Math.abs(startPoint.x - otherEnd.x) < 1e-6 && Math.abs(startPoint.y - otherEnd.y) < 1e-6) ||
        (Math.abs(endPoint.x - otherStart.x) < 1e-6 && Math.abs(endPoint.y - otherStart.y) < 1e-6) ||
        (Math.abs(endPoint.x - otherEnd.x) < 1e-6 && Math.abs(endPoint.y - otherEnd.y) < 1e-6)
      );
    });

    // 更新连接信息
    const connections = {
      start: [] as { wallId: string; point: Point; type: 'start' | 'end' }[],
      end: [] as { wallId: string; point: Point; type: 'start' | 'end' }[]
    };

    connectedWalls.forEach(otherWall => {
      const startPoint = wall.properties.startPoint;
      const endPoint = wall.properties.endPoint;
      const otherStart = otherWall.properties.startPoint;
      const otherEnd = otherWall.properties.endPoint;

      // 检查起点连接
      if (Math.abs(startPoint.x - otherStart.x) < 1e-6 && Math.abs(startPoint.y - otherStart.y) < 1e-6) {
        connections.start.push({ wallId: otherWall.id, point: otherStart, type: 'start' });
      }
      if (Math.abs(startPoint.x - otherEnd.x) < 1e-6 && Math.abs(startPoint.y - otherEnd.y) < 1e-6) {
        connections.start.push({ wallId: otherWall.id, point: otherEnd, type: 'end' });
      }

      // 检查终点连接
      if (Math.abs(endPoint.x - otherStart.x) < 1e-6 && Math.abs(endPoint.y - otherStart.y) < 1e-6) {
        connections.end.push({ wallId: otherWall.id, point: otherStart, type: 'start' });
      }
      if (Math.abs(endPoint.x - otherEnd.x) < 1e-6 && Math.abs(endPoint.y - otherEnd.y) < 1e-6) {
        connections.end.push({ wallId: otherWall.id, point: otherEnd, type: 'end' });
      }
    });

    // 返回更新后的墙体
    return {
      ...wall,
      properties: {
        ...wall.properties,
        connections
      }
    };
  });
}; 