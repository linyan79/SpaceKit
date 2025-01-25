import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Stage, Layer, Group, Rect, Line, Circle, Shape } from 'react-konva';
import { useDispatch, useSelector } from 'react-redux';
import Konva from 'konva';
import { nanoid } from '@reduxjs/toolkit';
import { Tooltip } from 'antd';
import { RootState } from '../../store';
import { ElementType, SpaceElement } from '../../types/space';
import { Point, WallElement, WallProperties, WallJoint } from '../../types/wall';
import { setSelectedElements, addElement, updateElement } from '../../store/spaceSlice';
import { calculateConnectionPoints } from '../../utils/wallConnectionManager';
import { COLORS } from '../../utils/constants';
import { handleElementDragStart, handleElementDragEnd } from '../../utils/eventUtils';
import { isPointInRect, isLineIntersectRect, getNextRotation } from '../../utils/geometryUtils';
import { executeAndRecord } from '../../utils/commandUtils';
import { createAddElementCommand, createUpdateElementCommand, createBatchDeleteElementsCommand } from '../../commands/elementCommands';
import { CommandType } from '../../types/command';
import WallDrawing from './WallDrawing';

// 计算两条直线墙的交点
const calculateWallIntersection = (wall1: WallProperties, wall2: WallProperties): Point | null => {
  const x1 = wall1.startPoint.x;
  const y1 = wall1.startPoint.y;
  const x2 = wall1.endPoint.x;
  const y2 = wall1.endPoint.y;
  const x3 = wall2.startPoint.x;
  const y3 = wall2.startPoint.y;
  const x4 = wall2.endPoint.x;
  const y4 = wall2.endPoint.y;

  // 计算分母
  const denominator = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
  if (Math.abs(denominator) < 1e-10) return null; // 平行或重合

  // 计算交点参数
  const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denominator;
  const u = -((x1 - x2) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denominator;

  // 检查交点是否在两条线段上
  if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
    return {
      x: x1 + t * (x2 - x1),
      y: y1 + t * (y2 - y1)
    };
  }

  return null;
};

const Canvas2D = () => {
  // 获取 Redux 的 dispatch 函数
  const dispatch = useDispatch();
  // 从 Redux 状态中获取选中的元素
  const selectedElements = useSelector((state: RootState) => state.space.selectedElements);
  // 从 Redux 状态中获取所有元素
  const elements = useSelector((state: RootState) => state.space.elements);
  // 是否正在绘制墙
  const [isDrawingWall, setIsDrawingWall] = useState(false);
  // 当前墙的类型，'straight' 或 'arc'
  const [wallType, setWallType] = useState<'straight' | 'arc'>('straight');
  // 是否连续绘制
  const [isContinuousDrawing, setIsContinuousDrawing] = useState(false);
  // 工位图片
  const [workstationImage, setWorkstationImage] = useState<HTMLImageElement | null>(null);
  // 拖拽偏移量
  const [dragOffset, setDragOffset] = useState<{ x: number, y: number } | null>(null);
  // 添加当前绘制状态引用
  const currentDrawingRef = useRef<{
    hasStartPoint: boolean;
    hasEndPoint: boolean;
  }>({ hasStartPoint: false, hasEndPoint: false });

  // 添加框选状态
  const [selectionBox, setSelectionBox] = useState<{
    start: Point;
    end: Point;
    isSelecting: boolean;
    isLeftToRight: boolean;
  } | null>(null);

  // 添加画布变换状态
  const [stageScale, setStageScale] = useState(1);
  const [stagePosition, setStagePosition] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const lastPointerPosition = useRef<{ x: number; y: number } | null>(null);

  // 判断点是否在矩形内
  const isPointInRect = (point: Point, rect: { start: Point; end: Point }) => {
    const minX = Math.min(rect.start.x, rect.end.x);
    const maxX = Math.max(rect.start.x, rect.end.x);
    const minY = Math.min(rect.start.y, rect.end.y);
    const maxY = Math.max(rect.start.y, rect.end.y);
    
    return point.x >= minX && point.x <= maxX && point.y >= minY && point.y <= maxY;
  };

  // 判断线段是否与矩形相交
  const isLineIntersectRect = (start: Point, end: Point, rect: { start: Point; end: Point }) => {
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
      // 使用线段相交判断算法
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

  // 判断元素是否被选中
  const isElementSelected = (element: SpaceElement) => {
    if (!selectionBox) return false;

    if (element.type === 'wall') {
      const wall = element as WallElement;
      if (wall.properties.type === 'straight') {
        // 左上到右下框选时，只选择完全在框内的墙
        if (selectionBox.isLeftToRight) {
          return isPointInRect(wall.properties.startPoint, selectionBox) && 
                 isPointInRect(wall.properties.endPoint, selectionBox);
        }
        // 其他方向框选时，相交也选中
        return isPointInRect(wall.properties.startPoint, selectionBox) || 
               isPointInRect(wall.properties.endPoint, selectionBox) ||
               isLineIntersectRect(wall.properties.startPoint, wall.properties.endPoint, selectionBox);
      } else if (wall.properties.type === 'arc' && wall.properties.centerPoint && wall.properties.radius && wall.properties.startAngle !== undefined && wall.properties.endAngle !== undefined) {
        // 弧形墙判断起点和终点
        const startPoint = {
          x: wall.properties.centerPoint.x + wall.properties.radius * Math.cos(wall.properties.startAngle * Math.PI / 180),
          y: wall.properties.centerPoint.y + wall.properties.radius * Math.sin(wall.properties.startAngle * Math.PI / 180)
        };
        const endPoint = {
          x: wall.properties.centerPoint.x + wall.properties.radius * Math.cos(wall.properties.endAngle * Math.PI / 180),
          y: wall.properties.centerPoint.y + wall.properties.radius * Math.sin(wall.properties.endAngle * Math.PI / 180)
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

  // 处理鼠标按下事件
  const handleStageMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    // 如果点击的不是舞台本身，或者点击的是任何图元，不启动框选
    const stage = e.target.getStage();
    if (!stage || e.target !== stage) {
      return;
    }

    // 检查鼠标是否在任何图元上
    const point = stage.getPointerPosition();
    if (!point) return;

    // 将点转换为画布坐标
    const transform = stage.getAbsoluteTransform().copy();
    transform.invert();
    const stagePoint = transform.point(point);

    // 检查该点是否在任何图元上
    const shape = stage.getIntersection(point);
    if (shape) {
      return; // 如果点在任何图元上，不启动框选
    }

    if (isDrawingWall) {
      const event = {
        ...e,
        evt: {
          ...e.evt,
          offsetX: stagePoint.x,
          offsetY: stagePoint.y,
          clientX: e.evt.clientX,
          clientY: e.evt.clientY,
        },
        point: stagePoint
      };
      // 将事件传递给 WallDrawing 组件
      const wallDrawingLayer = stage.findOne('#wall-drawing-layer');
      if (wallDrawingLayer) {
        wallDrawingLayer.fire('mousedown', event);
      }
      return;
    }

    // 只有在空白区域时才启动框选
    setSelectionBox({
      start: stagePoint,
      end: stagePoint,
      isSelecting: true,
      isLeftToRight: true
    });
  };

  // 处理鼠标移动事件
  const handleStageMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
    // 如果鼠标在任何图元上，不处理移动事件
    if (e.target !== e.target.getStage()) {
      return;
    }

    if (isDrawingWall) {
      const stage = e.target.getStage();
      if (!stage) return;
      
      const point = stage.getPointerPosition();
      if (point) {
        // 将屏幕坐标转换为画布坐标
        const transform = stage.getAbsoluteTransform().copy();
        transform.invert();
        const stagePoint = transform.point(point);

        const event = {
          ...e,
          evt: {
            ...e.evt,
            offsetX: stagePoint.x,
            offsetY: stagePoint.y,
            clientX: e.evt.clientX,
            clientY: e.evt.clientY,
          },
          point: stagePoint
        };
        // 将事件传递给 WallDrawing 组件
        const wallDrawingLayer = stage.findOne('#wall-drawing-layer');
        if (wallDrawingLayer) {
          wallDrawingLayer.fire('mousemove', event);
        }
      }
      return;
    }

    // 只有在框选状态下才处理移动事件
    if (!selectionBox?.isSelecting) return;

    const stage = e.target.getStage();
    const point = stage?.getPointerPosition();
    if (point) {
      // 转换点坐标到画布坐标系
      const transform = stage.getAbsoluteTransform().copy();
      transform.invert();
      const stagePoint = transform.point(point);
      
      setSelectionBox(prev => prev ? {
        ...prev,
        end: stagePoint,
        isLeftToRight: stagePoint.x > prev.start.x && stagePoint.y > prev.start.y
      } : null);
    }
  };

  // 处理鼠标松开事件
  const handleStageMouseUp = (e: Konva.KonvaEventObject<MouseEvent>) => {
    // 如果不是在框选状态，直接返回
    if (!selectionBox?.isSelecting) return;

    // 如果鼠标在任何图元上，取消框选
    if (e.target !== e.target.getStage()) {
      setSelectionBox(null);
      return;
    }

    // 选中框选的图元
    const selectedElements = elements.filter(isElementSelected);
    if (selectedElements.length > 0) {
      dispatch(setSelectedElements(selectedElements.map(el => el.id)));
    } else {
      // 只有在点击空白区域时才清除选择
      if (e.target === e.target.getStage()) {
        dispatch(setSelectedElements([]));
      }
    }

    setSelectionBox(null);
  };

  // 加载工位图片
  useEffect(() => {
    const image = new window.Image();
    image.src = '/src/assets/workstation.svg';
    image.onload = () => {
      setWorkstationImage(image);
    };
  }, []);

  // 修改事件监听
  useEffect(() => {
    /**
     * 开始绘制墙体的处理函数
     * @param e 事件对象，此处假设为CustomEvent类型，以获取详细信息
     */
    const handleStartWallDrawing = (e: Event) => {
      // 将事件对象转换为CustomEvent类型，以访问其特定属性
      const customEvent = e as CustomEvent;
      
      // 设置绘制状态为true，表示开始绘制墙体
      setIsDrawingWall(true);
      
      // 设置墙体类型
      setWallType(customEvent.detail.wallType);
      
      // 初始化当前绘制引用，设置起始点和结束点状态为false
      currentDrawingRef.current = { 
        hasStartPoint: false, 
        hasEndPoint: false
      };
      
      // 输出日志信息，指示墙体绘制开始，并显示墙体类型
      console.log('Wall drawing started:', customEvent.detail.wallType);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!e.key) return;  // 添加对key属性的检查
      
      if (e.key.toLowerCase() === 'c' && isDrawingWall) {
        setIsContinuousDrawing(prev => !prev);
      }
      
      // ESC 键处理
      if (e.key === 'Escape') {
        if (currentDrawingRef.current.hasStartPoint) {
          currentDrawingRef.current.hasStartPoint = false;
          currentDrawingRef.current.hasEndPoint = false;
        } else {
          setIsDrawingWall(false);
        }
      }
      
      // 空格键旋转
      if (e.key === ' ' && selectedElements.length === 1) {
        const selectedElement = elements.find(el => selectedElements.includes(el.id));
        if (selectedElement?.type === 'seat') {
          e.preventDefault(); // 防止页面滚动
          const walls = elements.filter(el => el.type === 'wall');
          const nextRotation = getNextRotation(selectedElement, walls);
          
          const updatedElement = {
            ...selectedElement,
            rotation: {
              ...selectedElement.rotation,
              z: nextRotation
            }
          };
          
          const command: CommandType = {
            type: 'ROTATE_ELEMENT',
            element: updatedElement,
            previousElement: selectedElement,
            rotation: nextRotation
          };
          
          executeAndRecord(command, dispatch);
        }
      }
    };

    // 监听WallDrawing组件发出的起点状态变化事件
    const handleWallDrawingStartPoint = () => {
      currentDrawingRef.current.hasStartPoint = true;
    };

    document.addEventListener('startWallDrawing', handleStartWallDrawing);
    document.addEventListener('wallDrawingStartPoint', handleWallDrawingStartPoint);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('startWallDrawing', handleStartWallDrawing);
      document.removeEventListener('wallDrawingStartPoint', handleWallDrawingStartPoint);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isDrawingWall, elements, selectedElements, dispatch]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const elementType = e.dataTransfer.getData('elementType') as ElementType;
    
    if (elementType === 'wall') {
      setIsDrawingWall(true);
      setWallType('straight');
      return;
    }
    
    // 获取 Konva Stage 实例
    const stageDiv = e.target as HTMLDivElement;
    const konvaStage = Konva.stages[0];
    if (!konvaStage) return;

    const stageRect = stageDiv.getBoundingClientRect();
    const scale = konvaStage.scaleX();
    
    const pointerPosition = {
      x: e.clientX - stageRect.left,
      y: e.clientY - stageRect.top
    };
    
    const transform = konvaStage.getAbsoluteTransform().copy();
    transform.invert();
    const stagePoint = transform.point(pointerPosition);

    const newElement: SpaceElement = {
      id: nanoid(),
      type: elementType,
      position: { x: stagePoint.x, y: stagePoint.y, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      dimensions: elementType === 'seat'
        ? { width: 120, height: 50, depth: 100 }
        : { width: 2, height: 0.1, depth: 2 },
      properties: {},
    };

    executeAndRecord(createAddElementCommand(newElement), dispatch);
  }, [dispatch]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleElementDragStart = useCallback((e: Konva.KonvaEventObject<DragEvent>, element: SpaceElement) => {
    e.cancelBubble = true;
    if (!selectedElements.includes(element.id)) {
      dispatch(setSelectedElements([element.id]));
    }
  }, [dispatch, selectedElements]);

  const handleElementDragEnd = useCallback((e: Konva.KonvaEventObject<DragEvent>, element: SpaceElement) => {
    e.cancelBubble = true;
    const node = e.target;
    const position = node.getPosition();
    
    const updatedElement = {
      ...element,
      position: {
        ...element.position,
        x: position.x,
        y: position.y
      }
    };
    
    executeAndRecord(createUpdateElementCommand(updatedElement, element), dispatch);
  }, [dispatch]);

  const renderWalls = (elements: SpaceElement[]) => {
    return elements.map((element) => {
      if (element.type === 'wall') {
        const wall = element as WallElement;
        const isSelected = selectedElements.includes(element.id);
        const isGlass = wall.properties.isGlass;
        
        if (wall.properties.type === 'straight') {
          const thickness = wall.properties.thickness;
          const angle = Math.atan2(
            wall.properties.endPoint.y - wall.properties.startPoint.y, 
            wall.properties.endPoint.x - wall.properties.startPoint.x
          );
          const halfThickness = thickness / 2;
          
          const points = [
            wall.properties.startPoint.x - halfThickness * Math.sin(angle),
            wall.properties.startPoint.y + halfThickness * Math.cos(angle),
            wall.properties.startPoint.x + halfThickness * Math.sin(angle),
            wall.properties.startPoint.y - halfThickness * Math.cos(angle),
            wall.properties.endPoint.x + halfThickness * Math.sin(angle),
            wall.properties.endPoint.y - halfThickness * Math.cos(angle),
            wall.properties.endPoint.x - halfThickness * Math.sin(angle),
            wall.properties.endPoint.y + halfThickness * Math.cos(angle),
          ];
          
          return (
            <Group key={element.id}>
              <Shape
                sceneFunc={(context, shape) => {
                  context.beginPath();
                  context.moveTo(points[0], points[1]);
                  context.lineTo(points[2], points[3]);
                  context.lineTo(points[4], points[5]);
                  context.lineTo(points[6], points[7]);
                  context.closePath();
                  context.fillStrokeShape(shape);
                }}
                fill={isSelected 
                  ? (isGlass ? COLORS.WALL_GLASS_SELECTED : COLORS.WALL_SELECTED)
                  : (isGlass ? COLORS.WALL_GLASS : COLORS.WALL_DEFAULT)}
                opacity={1}
                onClick={() => !isDrawingWall && dispatch(setSelectedElements([element.id]))}
                onMouseEnter={(e) => {
                  if (!isDrawingWall) {
                    const stage = e.target.getStage();
                    if (stage) stage.container().style.cursor = 'pointer';
                    const shape = e.target as Konva.Shape;
                    shape.fill(isGlass ? COLORS.WALL_GLASS_HOVER : COLORS.WALL_HOVER);
                    shape.getLayer()?.batchDraw();
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isDrawingWall) {
                    const stage = e.target.getStage();
                    if (stage) stage.container().style.cursor = 'default';
                    const shape = e.target as Konva.Shape;
                    shape.fill(isSelected 
                      ? (isGlass ? COLORS.WALL_GLASS_SELECTED : COLORS.WALL_SELECTED)
                      : (isGlass ? COLORS.WALL_GLASS : COLORS.WALL_DEFAULT));
                    shape.getLayer()?.batchDraw();
                  }
                }}
              />
            </Group>
          );
        } else if (wall.properties.type === 'arc' && wall.properties.centerPoint && wall.properties.radius && wall.properties.startAngle && wall.properties.endAngle) {
          // 绘制弧形墙
          const points: number[] = [];
          const segments = 32;
          const angleStep = (wall.properties.endAngle - wall.properties.startAngle) / segments;
          
          for (let i = 0; i <= segments; i++) {
            const angle = (wall.properties.startAngle + i * angleStep) * (Math.PI / 180);
            const point = {
              x: wall.properties.centerPoint.x + wall.properties.radius * Math.cos(angle),
              y: wall.properties.centerPoint.y + wall.properties.radius * Math.sin(angle)
            };
            points.push(point.x, point.y);
          }
          
          return (
            <Line
              key={element.id}
              points={points}
              stroke={isSelected 
                ? (isGlass ? COLORS.WALL_GLASS_SELECTED : COLORS.WALL_SELECTED)
                : (isGlass ? COLORS.WALL_GLASS : COLORS.WALL_DEFAULT)}
              strokeWidth={wall.properties.thickness}
              onClick={() => !isDrawingWall && dispatch(setSelectedElements([element.id]))}
              onMouseEnter={(e) => {
                if (!isDrawingWall) {
                  const stage = e.target.getStage();
                  if (stage) stage.container().style.cursor = 'pointer';
                  const line = e.target as Konva.Line;
                  line.stroke(isGlass ? COLORS.WALL_GLASS_HOVER : COLORS.WALL_HOVER);
                  line.getLayer()?.batchDraw();
                }
              }}
              onMouseLeave={(e) => {
                if (!isDrawingWall) {
                  const stage = e.target.getStage();
                  if (stage) stage.container().style.cursor = 'default';
                  const line = e.target as Konva.Line;
                  line.stroke(isSelected 
                    ? (isGlass ? COLORS.WALL_GLASS_SELECTED : COLORS.WALL_SELECTED)
                    : (isGlass ? COLORS.WALL_GLASS : COLORS.WALL_DEFAULT));
                  line.getLayer()?.batchDraw();
                }
              }}
            />
          );
        }
      }
      return null;
    });
  };

  const renderJunctions = (elements: SpaceElement[]) => {
    const walls = elements.filter(el => el.type === 'wall') as WallElement[];
    const junctions = new Map<string, Point>();

    // 收集所有连接点
    walls.forEach(wall1 => {
      walls.forEach(wall2 => {
        if (wall1.id === wall2.id) return;

        const checkConnection = (p1: Point, p2: Point) => {
          if (Math.abs(p1.x - p2.x) < 1 && Math.abs(p1.y - p2.y) < 1) {
            const key = `${Math.round(p1.x)},${Math.round(p1.y)}`;
            junctions.set(key, { x: p1.x, y: p1.y });
          }
        };

        // 检查所有可能的连接点
        checkConnection(wall1.properties.startPoint, wall2.properties.startPoint);
        checkConnection(wall1.properties.startPoint, wall2.properties.endPoint);
        checkConnection(wall1.properties.endPoint, wall2.properties.startPoint);
        checkConnection(wall1.properties.endPoint, wall2.properties.endPoint);
      });
    });
    
    // 渲染连接点
    return Array.from(junctions.entries()).map(([key, point]) => {
      const connectedWalls = walls.filter(wall => {
        if (!wall.properties || !wall.properties.startPoint || !wall.properties.endPoint) {
          return false;
        }
        return (
          Math.abs(wall.properties.startPoint.x - point.x) < 1 && Math.abs(wall.properties.startPoint.y - point.y) < 1 ||
          Math.abs(wall.properties.endPoint.x - point.x) < 1 && Math.abs(wall.properties.endPoint.y - point.y) < 1
        );
      });
      
      // 如果连接点有超过两个墙，不进行连接处理
      if (connectedWalls.length === 2) {
        const pathPoints = calculateConnectionPoints(point, connectedWalls);
        if (!pathPoints.length) return null;

        // 检查两个墙是否都是玻璃隔断
        const isAllGlass = connectedWalls.every(w => w.properties.isGlass);
        
        return (
          <Shape
            key={`junction-${key}`}
            sceneFunc={(context, shape) => {
              context.beginPath();
              context.moveTo(pathPoints[0].x, pathPoints[0].y);
              pathPoints.forEach((p: Point) => {
                context.lineTo(p.x, p.y);
              });
              context.closePath();
              context.fillStrokeShape(shape);
            }}
            fill={isAllGlass ? COLORS.WALL_GLASS : COLORS.WALL_DEFAULT}
            opacity={1}
            stroke="none"
            strokeWidth={0}
            perfectDrawEnabled={false}
            listening={false}
          />
        );
      }
      return null;
    });
  };

  // 修改 Seat 组件
  const Seat = useCallback(({ 
    element, 
    isDrawingWall,
  }: { 
    element: SpaceElement; 
    isDrawingWall: boolean;
  }) => {
    const dispatch = useDispatch();
    const selectedElements = useSelector((state: RootState) => state.space.selectedElements);
    const [isHovered, setIsHovered] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    
    const { width, depth } = element.dimensions;
    const deskDepth = 50;
    const isSelected = selectedElements.includes(element.id);

    const handleClick = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
      if (!isDrawingWall && !isDragging) {
        dispatch(setSelectedElements([element.id]));
        e.cancelBubble = true;
      }
    }, [dispatch, element.id, isDragging, isDrawingWall]);

    const handleDragStart = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
      if (!isDrawingWall) {
        setIsDragging(true);
        handleElementDragStart(e, element);
      }
    }, [element, isDrawingWall]);

    const handleDragEnd = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
      if (!isDrawingWall) {
        setIsDragging(false);
        handleElementDragEnd(e, element);
      }
    }, [element, isDrawingWall]);

    const handleMouseEnter = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
      if (!isDrawingWall && !isDragging) {
        const stage = e.target.getStage();
        if (stage) stage.container().style.cursor = 'pointer';
        setIsHovered(true);
        e.cancelBubble = true;
      }
    }, [isDragging, isDrawingWall]);

    const handleMouseLeave = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
      if (!isDrawingWall && !isDragging) {
        const stage = e.target.getStage();
        if (stage) stage.container().style.cursor = 'default';
        setIsHovered(false);
        e.cancelBubble = true;
      }
    }, [isDragging, isDrawingWall]);

    return (
      <Group
        x={element.position.x}
        y={element.position.y}
        rotation={element.rotation.z * 180 / Math.PI}
        draggable={!isDrawingWall}
        onClick={handleClick}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* 工位空间范围 */}
        <Rect
          x={-width / 2}
          y={-depth / 2}
          width={width}
          height={depth}
          stroke={isSelected ? "#ff4d4f" : "#1890ff"}
          strokeWidth={1}
          dash={[5, 5]}
          opacity={0.5}
          fill={isSelected ? COLORS.SEAT_SELECTED : (isHovered ? COLORS.SEAT_HOVER : COLORS.SEAT_DEFAULT)}
        />
        {/* 办公桌 */}
        <Rect
          x={-width / 2}
          y={-depth / 2}
          width={width}
          height={deskDepth}
          fill="#f0f0f0"
          stroke="#666"
          strokeWidth={2}
        />
        {/* 桌上装饰 - 显示器 */}
        <Rect
          x={-width * 0.3}
          y={-depth / 2 + 10}
          width={width * 0.3}
          height={15}
          fill="#d9d9d9"
          stroke="#666"
          strokeWidth={1}
        />
        {/* 桌上装饰 - 键盘区 */}
        <Rect
          x={width * 0.1}
          y={-depth / 2 + 10}
          width={width * 0.2}
          height={20}
          fill="#d9d9d9"
          stroke="#666"
          strokeWidth={1}
        />
        {/* 座位 */}
        <Circle
          x={0}
          y={depth / 2 - 10}
          radius={8}
          fill="#e6f7ff"
          stroke="#1890ff"
          strokeWidth={2}
        />
        {/* 座位朝向 */}
        <Line
          points={[0, depth / 2 - 10, 0, depth / 2 - 2]}
          stroke="#1890ff"
          strokeWidth={2}
        />
      </Group>
    );
  }, [handleElementDragStart, handleElementDragEnd]);

  // 修改 renderElements 函数
  const renderElements = () => {
    return (
      <>
        {renderWalls(elements)}
        {renderJunctions(elements)}
        {elements.map((element) => {
          if (element.type === 'seat') {
            return (
              <Seat 
                key={element.id} 
                element={element} 
                isDrawingWall={isDrawingWall}
              />
            );
          } else if (element.type !== 'wall') {
            const isSelected = selectedElements.includes(element.id);
            return (
              <Group
                key={element.id}
                x={element.position.x}
                y={element.position.y}
                draggable={!isDrawingWall}
                onDragStart={(e) => !isDrawingWall && handleElementDragStart(e, element)}
                onDragEnd={(e) => !isDrawingWall && handleElementDragEnd(e, element)}
                onClick={() => !isDrawingWall && dispatch(setSelectedElements([element.id]))}
              >
                <Rect
                  width={element.dimensions.width}
                  height={element.dimensions.depth}
                  fill={isSelected ? '#1890ff' : '#fff'}
                  stroke="#000"
                  strokeWidth={1}
                />
              </Group>
            );
          }
          return null;
        })}
      </>
    );
  };

  // 修改点击空白区域取消选择的处理函数
  const handleStageClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    // 如果点击的是舞台本身（空白区域）且不在绘制墙状态，且不在框选状态
    if (e.target === e.target.getStage() && !isDrawingWall && !selectionBox?.isSelecting) {
      dispatch(setSelectedElements([]));
    }
  };

  // 处理画布缩放
  const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    
    if (isDrawingWall) return; // 绘制墙时不允许缩放
    
    const stage = e.target.getStage();
    if (!stage) return;
    
    const oldScale = stageScale;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const mousePointTo = {
      x: (pointer.x - stagePosition.x) / oldScale,
      y: (pointer.y - stagePosition.y) / oldScale,
    };

    // 计算新的缩放值
    const scaleBy = 1.1;
    const newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;

    // 限制缩放范围
    const limitedScale = Math.min(Math.max(newScale, 0.1), 5);
    
    // 如果超出范围则不处理
    if (limitedScale === oldScale) return;

    const newPos = {
      x: pointer.x - mousePointTo.x * limitedScale,
      y: pointer.y - mousePointTo.y * limitedScale,
    };

    setStageScale(limitedScale);
    setStagePosition(newPos);
  };

  // 处理画布平移开始
  const handlePanStart = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!isPanning) return;
    
    const stage = e.target.getStage();
    if (!stage) return;
    
    e.evt.preventDefault();
    const pointer = stage.getPointerPosition();
    if (!pointer) return;
    
    lastPointerPosition.current = pointer;
  };

  // 处理画布平移
  const handlePanMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!isPanning || !lastPointerPosition.current) return;
    
    const stage = e.target.getStage();
    if (!stage) return;
    
    e.evt.preventDefault();
    const pointer = stage.getPointerPosition();
    if (!pointer) return;
    
    const dx = pointer.x - lastPointerPosition.current.x;
    const dy = pointer.y - lastPointerPosition.current.y;
    
    setStagePosition({
      x: stagePosition.x + dx,
      y: stagePosition.y + dy,
    });
    
    lastPointerPosition.current = pointer;
  };

  // 处理画布平移结束
  const handlePanEnd = () => {
    lastPointerPosition.current = null;
  };

  // 添加键盘事件处理
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!e.key) return;  // 添加对key属性的检查
      
      if (e.key.toLowerCase() === 'p') {
        setIsPanning(true);
      } else if (e.key === 'Escape') {
        setIsPanning(false);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (!e.key) return;  // 添加对key属性的检查
      
      if (e.key.toLowerCase() === 'p') {
        setIsPanning(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // 添加键盘事件监听
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!e.key) return;  // 添加对key属性的检查
      
      // 如果按下 Delete 键且有选中的图元
      if (e.key === 'Delete' && selectedElements.length > 0) {
        // 获取要删除的图元
        const elementsToDelete = elements.filter(element => selectedElements.includes(element.id));
        if (elementsToDelete.length > 0) {
          // 创建并执行删除命令
          executeAndRecord(createBatchDeleteElementsCommand(elementsToDelete), dispatch);
          // 清除选中状态
          dispatch(setSelectedElements([]));
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [dispatch, elements, selectedElements]);

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      style={{ width: '100%', height: '100%', position: 'relative' }}
    >
      {isDrawingWall && (
        <div style={{
          position: 'absolute',
          top: 10,
          left: 10,
          zIndex: 1000,
          background: '#fff',
          padding: '8px',
          borderRadius: '4px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          display: 'flex',
          gap: '8px',
          alignItems: 'center'
        }}>
          <button
            onClick={() => setWallType('straight')}
            style={{
              marginRight: '8px',
              background: wallType === 'straight' ? '#1890ff' : '#fff',
              color: wallType === 'straight' ? '#fff' : '#000',
              border: '1px solid #d9d9d9',
              padding: '4px 8px',
              borderRadius: '2px',
              cursor: 'pointer'
            }}
          >
            直线墙
          </button>
          <button
            onClick={() => setWallType('arc')}
            style={{
              marginRight: '8px',
              background: wallType === 'arc' ? '#1890ff' : '#fff',
              color: wallType === 'arc' ? '#fff' : '#000',
              border: '1px solid #d9d9d9',
              padding: '4px 8px',
              borderRadius: '2px',
              cursor: 'pointer'
            }}
          >
            弧线墙
          </button>
          <Tooltip title="连续绘制 [C]">
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              cursor: 'pointer'
            }}>
              <input
                type="checkbox"
                checked={isContinuousDrawing}
                onChange={(e) => {
                  setIsContinuousDrawing(e.target.checked);
                }}
                style={{ cursor: 'pointer' }}
              />
              连续绘制
            </label>
          </Tooltip>
          <Tooltip title="按ESC退出当前绘制，再按一次ESC退出绘制模式">
            <button
              onClick={() => setIsDrawingWall(false)}
              style={{
                background: '#ff4d4f',
                color: '#fff',
                border: 'none',
                padding: '4px 8px',
                borderRadius: '2px',
                cursor: 'pointer'
              }}
            >
              退出绘制
            </button>
          </Tooltip>
        </div>
      )}
      <Stage
        width={window.innerWidth}
        height={window.innerHeight}
        style={{ background: '#f0f2f5' }}
        onClick={handleStageClick}
        onMouseDown={(e) => {
          if (isPanning) {
            handlePanStart(e);
          } else {
            handleStageMouseDown(e);
          }
        }}
        onMouseMove={(e) => {
          if (isPanning) {
            handlePanMove(e);
          } else {
            handleStageMouseMove(e);
          }
        }}
        onMouseUp={(e) => {
          if (isPanning) {
            handlePanEnd();
          } else {
            handleStageMouseUp(e);
          }
        }}
        onWheel={handleWheel}
        scaleX={stageScale}
        scaleY={stageScale}
        x={stagePosition.x}
        y={stagePosition.y}
      >
        <Layer>
          {renderElements()}
          {/* 渲染选择框 */}
          {selectionBox?.isSelecting && (
            <Rect
              x={Math.min(selectionBox.start.x, selectionBox.end.x)}
              y={Math.min(selectionBox.start.y, selectionBox.end.y)}
              width={Math.abs(selectionBox.end.x - selectionBox.start.x)}
              height={Math.abs(selectionBox.end.y - selectionBox.start.y)}
              stroke={selectionBox.isLeftToRight ? "#1890ff" : "#ff4d4f"}
              strokeWidth={1}
              dash={[5, 5]}
              fill="rgba(24, 144, 255, 0.1)"
            />
          )}
        </Layer>

        {isDrawingWall && (
          <WallDrawing
            isDrawing={isDrawingWall}
            setIsDrawing={setIsDrawingWall}
            wallType={wallType}
            setWallType={setWallType}
            isContinuousDrawing={isContinuousDrawing}
            stageScale={stageScale}
            stagePosition={stagePosition}
          />
        )}
      </Stage>
    </div>
  );
};

export default Canvas2D; 