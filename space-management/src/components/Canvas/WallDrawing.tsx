import { useCallback, useEffect, useState } from 'react';
import { Layer, Line, Circle, Text, Group, Arc } from 'react-konva';
import { useDispatch, useSelector } from 'react-redux';
import { nanoid } from '@reduxjs/toolkit';
import { Tooltip } from 'antd';
import { RootState } from '../../store';
import { addElement } from '../../store/spaceSlice';
import { Point, WallPoint, WallProperties, SnapPoint, SnapConfig } from '../../types/wall';
import { SpaceElement } from '../../types/space';
import { executeAndRecord } from '../../utils/commandUtils';
import { createAddElementCommand } from '../../commands/elementCommands';

interface WallDrawingProps {
  isDrawing: boolean;
  setIsDrawing: (isDrawing: boolean) => void;
  wallType: 'straight' | 'arc';
  setWallType: (wallType: 'straight' | 'arc') => void;
  isContinuousDrawing: boolean;
  stageScale: number;
  stagePosition: { x: number; y: number };
}

const DEFAULT_WALL_THICKNESS = 20;
const CURSOR_SIZE = 20;

const WallDrawing: React.FC<WallDrawingProps> = ({ 
  isDrawing, 
  setIsDrawing, 
  wallType, 
  setWallType,
  isContinuousDrawing,
  stageScale,
  stagePosition
}) => {
  const dispatch = useDispatch();
  const elements = useSelector((state: RootState) => state.space.elements);
  const snapConfig = useSelector((state: RootState) => state.space.snapConfig) as SnapConfig;
  
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const [endPoint, setEndPoint] = useState<Point | null>(null);
  const [midPoint, setMidPoint] = useState<Point | null>(null);
  const [currentPoint, setCurrentPoint] = useState<Point | null>(null);
  const [snapPoints, setSnapPoints] = useState<SnapPoint[]>([]);
  const [cursorPoint, setCursorPoint] = useState<Point | null>(null);
  const [dimensions, setDimensions] = useState<{ length?: number; radius?: number; angle?: number }>({});
  const [wallThickness, setWallThickness] = useState(DEFAULT_WALL_THICKNESS);
  const [isShiftPressed, setIsShiftPressed] = useState(false);

  // 计算捕捉点和投影点
  const calculateSnapPoints = useCallback(() => {
    const points: SnapPoint[] = [];
    elements.forEach((element) => {
      if (element.type === 'wall') {
        const wall = element.properties as WallProperties;
        // 端点
        points.push({
          x: wall.startPoint.x,
          y: wall.startPoint.y,
          type: 'endpoint',
          wallId: element.id
        });
        points.push({
          x: wall.endPoint.x,
          y: wall.endPoint.y,
          type: 'endpoint',
          wallId: element.id
        });
        // 中点
        points.push({
          x: (wall.startPoint.x + wall.endPoint.x) / 2,
          y: (wall.startPoint.y + wall.endPoint.y) / 2,
          type: 'center',
          wallId: element.id
        });
      }
    });
    setSnapPoints(points);
  }, [elements]);

  // 修改重置函数
  const resetDrawing = useCallback(() => {
    // 重置到拾取第一个点的状态
    setStartPoint(null);
    setEndPoint(null);
    setMidPoint(null);
    setCurrentPoint(null);
    setDimensions({});
  }, []);

  // 添加对 elements 变化的监听
  useEffect(() => {
    calculateSnapPoints();
  }, [elements, calculateSnapPoints]);

  // 添加重置事件监听
  useEffect(() => {
    const handleResetDrawing = () => {
      resetDrawing();
    };

    const stage = document.querySelector('canvas')?.parentElement;
    if (stage) {
      stage.addEventListener('resetDrawing', handleResetDrawing);
      return () => {
        stage.removeEventListener('resetDrawing', handleResetDrawing);
      };
    }
  }, [resetDrawing]);

  // 添加对 isDrawing 状态变化的监听
  useEffect(() => {
    if (isDrawing) {
      // 重置所有状态
      resetDrawing();
    }
  }, [isDrawing, resetDrawing]);

  // 计算点到线段的投影点
  const calculateProjectionPoint = (point: WallPoint, lineStart: WallPoint, lineEnd: WallPoint): WallPoint | null => {
    const dx = lineEnd.x - lineStart.x;
    const dy = lineEnd.y - lineStart.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    
    if (length === 0) return null;

    const t = ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / (length * length);
    
    if (t < 0 || t > 1) return null;

    return {
      x: lineStart.x + t * dx,
      y: lineStart.y + t * dy
    };
  };

  // 查找最近的捕捉点或投影点
  const findNearestSnapPoint = (point: WallPoint): SnapPoint => {
    let nearestPoint: SnapPoint = { ...point, type: 'endpoint' };
    let minDistance = snapConfig.snapDistance;

    // 检查端点和中点
    snapPoints.forEach((snapPoint) => {
      const distance = Math.sqrt(
        Math.pow(point.x - snapPoint.x, 2) + Math.pow(point.y - snapPoint.y, 2)
      );
      if (distance < minDistance) {
        minDistance = distance;
        nearestPoint = { ...snapPoint, distance };
      }
    });

    // 如果没有找到端点或中点，检查投影点
    if (minDistance === snapConfig.snapDistance) {
      elements.forEach((element) => {
        if (element.type === 'wall') {
          const wall = element.properties as WallProperties;
          const projectionPoint = calculateProjectionPoint(point, wall.startPoint, wall.endPoint);
          
          if (projectionPoint) {
            const distance = Math.sqrt(
              Math.pow(point.x - projectionPoint.x, 2) + Math.pow(point.y - projectionPoint.y, 2)
            );
            if (distance < minDistance) {
              minDistance = distance;
              nearestPoint = {
                ...projectionPoint,
                type: 'projection',
                wallId: element.id,
                distance
              };
            }
          }
        }
      });
    }

    return nearestPoint;
  };

  // 计算三点圆弧的参数
  const calculateArcParameters = (p1: WallPoint, p2: WallPoint, p3: WallPoint) => {
    // 计算三点确定的圆的圆心和半径
    const temp = p2.x * p2.x + p2.y * p2.y;
    const bc = (p1.x * p1.x + p1.y * p1.y - temp) / 2.0;
    const cd = (temp - p3.x * p3.x - p3.y * p3.y) / 2.0;
    const det = (p1.x - p2.x) * (p2.y - p3.y) - (p2.x - p3.x) * (p1.y - p2.y);

    if (Math.abs(det) < 1e-6) return null;

    const centerX = (bc * (p2.y - p3.y) - cd * (p1.y - p2.y)) / det;
    const centerY = ((p1.x - p2.x) * cd - (p2.x - p3.x) * bc) / det;
    const radius = Math.sqrt(Math.pow(p1.x - centerX, 2) + Math.pow(p1.y - centerY, 2));

    // 计算三个点相对于圆心的角度（弧度）
    const startAngle = Math.atan2(p1.y - centerY, p1.x - centerX);
    const midAngle = Math.atan2(p2.y - centerY, p2.x - centerX);
    const endAngle = Math.atan2(p3.y - centerY, p3.x - centerX);

    // 将角度转换为度数（0-360）
    const toDegrees = (rad: number) => {
      let deg = rad * (180 / Math.PI);
      while (deg < 0) deg += 360;
      return deg;
    };

    // 计算三个点的角度（度数）
    const startDeg = toDegrees(startAngle);
    const midDeg = toDegrees(midAngle);
    const endDeg = toDegrees(endAngle);

    // 判断圆弧方向（使用三点的叉积）
    const crossProduct = (p2.x - p1.x) * (p3.y - p1.y) - (p2.y - p1.y) * (p3.x - p1.x);
    const isClockwise = crossProduct > 0;

    // 计算圆弧角度
    let angle;
    if (isClockwise) {
      angle = endDeg <= startDeg ? endDeg - startDeg + 360 : endDeg - startDeg;
    } else {
      angle = endDeg >= startDeg ? endDeg - startDeg - 360 : endDeg - startDeg;
    }

    // 检查中点是否在圆弧上
    let midPointAngle = midDeg - startDeg;
    if (isClockwise) {
      if (midPointAngle < 0) midPointAngle += 360;
    } else {
      if (midPointAngle > 0) midPointAngle -= 360;
    }

    // 如果中点不在圆弧上，取补角
    if ((isClockwise && midPointAngle > angle) || (!isClockwise && midPointAngle < angle)) {
      angle = -angle;
    }

    return {
      center: { x: centerX, y: centerY },
      radius,
      rotation: startDeg,
      angle: angle,
      clockwise: isClockwise
    };
  };

  // 计算尺寸
  const calculateDimensions = useCallback(() => {
    if (wallType === 'straight') {
      if (!startPoint || !currentPoint) return;
      const length = Math.sqrt(
        Math.pow(currentPoint.x - startPoint.x, 2) +
        Math.pow(currentPoint.y - startPoint.y, 2)
      );
      setDimensions({ length });
    } else if (wallType === 'arc') {
      if (!startPoint || !endPoint || !currentPoint) return;
      if (!midPoint) {
        // 只显示直线距离
        const length = Math.sqrt(
          Math.pow(endPoint.x - startPoint.x, 2) +
          Math.pow(endPoint.y - startPoint.y, 2)
        );
        setDimensions({ length });
      } else {
        // 计算圆弧参数
        const arcParams = calculateArcParameters(startPoint, midPoint, endPoint);
        if (arcParams) {
          const { radius, angle } = arcParams;
          // 计算圆弧长度
          const arcLength = radius * Math.abs(angle) * (Math.PI / 180);
          setDimensions({ 
            radius,
            length: arcLength,
            angle: Math.abs(angle)
          });
        }
      }
    }
  }, [startPoint, endPoint, midPoint, currentPoint, wallType]);

  // 添加键盘事件监听
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        setIsShiftPressed(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        setIsShiftPressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // 计算水平或垂直对齐的点
  const calculateAlignedPoint = (start: WallPoint, end: SnapPoint): SnapPoint => {
    if (!isShiftPressed) return end;

    const dx = Math.abs(end.x - start.x);
    const dy = Math.abs(end.y - start.y);

    // 如果水平距离大于垂直距离，保持水平对齐
    if (dx > dy) {
      return { ...end, x: end.x, y: start.y };
    } else {
      // 否则保持垂直对齐
      return { ...end, x: start.x, y: end.y };
    }
  };

  const handleMouseDown = (e: any) => {
    if (!isDrawing) return;

    const stage = e.target.getStage();
    const point = stage.getPointerPosition();
    const transform = stage.getAbsoluteTransform().copy();
    transform.invert();
    const stagePoint = transform.point(point);

    const mousePoint = {
      x: stagePoint.x,
      y: stagePoint.y
    };

    let snapPoint = findNearestSnapPoint(mousePoint);

    // 如果是直线墙且已有起点，应用水平/垂直对齐
    if (wallType === 'straight' && startPoint && isShiftPressed) {
      snapPoint = calculateAlignedPoint(startPoint, snapPoint);
    }

    if (!startPoint) {
      setStartPoint(snapPoint);
      setCurrentPoint(snapPoint);
    } else if (wallType === 'straight' || (wallType === 'arc' && !endPoint)) {
      if (wallType === 'straight') {
        // 创建直线墙，使用当前的光标点（可能经过正交对齐）
        const newWall: SpaceElement = {
          id: nanoid(),
          type: 'wall',
          position: { x: 0, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
          dimensions: { width: 0, height: 0, depth: 0 },
          properties: {
            type: 'straight',
            startPoint: startPoint,
            endPoint: cursorPoint || snapPoint,
            thickness: wallThickness,
            isGlass: false
          }
        };
        executeAndRecord(createAddElementCommand(newWall), dispatch);
        
        if (isContinuousDrawing) {
          // 连续绘制模式：将终点设为新的起点
          setStartPoint(cursorPoint || snapPoint);
          setCurrentPoint(cursorPoint || snapPoint);
        } else {
          // 非连续绘制模式：重置起点，准备绘制新的墙
          resetDrawing();
        }
      } else {
        setEndPoint(snapPoint);
      }
    } else if (wallType === 'arc' && endPoint) {
      const arcParams = calculateArcParameters(startPoint, endPoint, snapPoint);
      if (arcParams) {
        // 创建圆弧墙
        const newWall: SpaceElement = {
          id: nanoid(),
          type: 'wall',
          position: { x: 0, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
          dimensions: { width: 0, height: 0, depth: 0 },
          properties: {
            type: 'arc',
            startPoint: startPoint,
            endPoint: snapPoint,
            centerPoint: arcParams.center,
            radius: arcParams.radius,
            startAngle: arcParams.rotation,
            angle: arcParams.angle,
            thickness: wallThickness,
            isGlass: false
          }
        };
        executeAndRecord(createAddElementCommand(newWall), dispatch);
        
        if (isContinuousDrawing) {
          // 连续绘制模式：将终点设为新的起点
          setStartPoint(snapPoint);
          setEndPoint(null);
          setCurrentPoint(snapPoint);
        } else {
          // 非连续绘制模式：重置起点，准备绘制新的墙
          resetDrawing();
        }
      }
    }
  };

  const handleMouseMove = (e: any) => {
    if (!isDrawing) return;
    
    const stage = e.target.getStage();
    if (!stage) return;

    const point = stage.getPointerPosition();
    const transform = stage.getAbsoluteTransform().copy();
    transform.invert();
    const stagePoint = transform.point(point);

    const mousePoint = {
      x: stagePoint.x,
      y: stagePoint.y
    };

    let snappedPoint = findNearestSnapPoint(mousePoint);

    // 如果是直线墙且已有起点，应用水平/垂直对齐
    if (wallType === 'straight' && startPoint && isShiftPressed) {
      snappedPoint = calculateAlignedPoint(startPoint, snappedPoint);
    }
    
    setCursorPoint(snappedPoint);
    setCurrentPoint(snappedPoint);
    
    if (startPoint) {
      calculateDimensions();
    }
  };

  // 渲染捕捉点和辅助线
  const renderSnapHelpers = () => {
    if (!currentPoint) return null;

    return (
      <>
        {/* 捕捉点 */}
        {snapPoints.map((point, index) => (
          <Circle
            key={`snap-point-${index}`}
            x={point.x}
            y={point.y}
            radius={3 / stageScale}
            fill={point.type === 'endpoint' ? '#ff4d4f' : '#1890ff'}
            opacity={0.5}
          />
        ))}
        
        {/* 十字光标 */}
        {cursorPoint && (
          <Group>
            {/* 水平线 */}
            <Line
              points={[
                cursorPoint.x - CURSOR_SIZE / stageScale,
                cursorPoint.y,
                cursorPoint.x + CURSOR_SIZE / stageScale,
                cursorPoint.y
              ]}
              stroke="#000"
              strokeWidth={1 / stageScale}
            />
            {/* 垂直线 */}
            <Line
              points={[
                cursorPoint.x,
                cursorPoint.y - CURSOR_SIZE / stageScale,
                cursorPoint.x,
                cursorPoint.y + CURSOR_SIZE / stageScale
              ]}
              stroke="#000"
              strokeWidth={1 / stageScale}
            />
            {/* 捕捉点指示器 */}
            <Circle
              x={cursorPoint.x}
              y={cursorPoint.y}
              radius={3 / stageScale}
              fill={(cursorPoint as SnapPoint).type === 'projection' ? '#52c41a' : '#1890ff'}
            />
          </Group>
        )}
      </>
    );
  };

  // 修改墙体预览，使用捕捉点位置
  const renderWallPreview = () => {
    if (!startPoint || !currentPoint || !cursorPoint) return null;

    return (
      <>
        {wallType === 'straight' ? (
          // 直线墙预览
          <>
            {/* 填充区域 */}
            <Line
              points={[startPoint.x, startPoint.y, cursorPoint.x, cursorPoint.y]}
              stroke="#000"
              strokeWidth={wallThickness}
              opacity={0.1}
            />
            {/* 上边界虚线 */}
            <Line
              points={[
                startPoint.x + (wallThickness / 2) * Math.sin(Math.atan2(cursorPoint.y - startPoint.y, cursorPoint.x - startPoint.x)),
                startPoint.y - (wallThickness / 2) * Math.cos(Math.atan2(cursorPoint.y - startPoint.y, cursorPoint.x - startPoint.x)),
                cursorPoint.x + (wallThickness / 2) * Math.sin(Math.atan2(cursorPoint.y - startPoint.y, cursorPoint.x - startPoint.x)),
                cursorPoint.y - (wallThickness / 2) * Math.cos(Math.atan2(cursorPoint.y - startPoint.y, cursorPoint.x - startPoint.x))
              ]}
              stroke="#000"
              strokeWidth={1}
              dash={[5, 5]}
            />
            {/* 下边界虚线 */}
            <Line
              points={[
                startPoint.x - (wallThickness / 2) * Math.sin(Math.atan2(cursorPoint.y - startPoint.y, cursorPoint.x - startPoint.x)),
                startPoint.y + (wallThickness / 2) * Math.cos(Math.atan2(cursorPoint.y - startPoint.y, cursorPoint.x - startPoint.x)),
                cursorPoint.x - (wallThickness / 2) * Math.sin(Math.atan2(cursorPoint.y - startPoint.y, cursorPoint.x - startPoint.x)),
                cursorPoint.y + (wallThickness / 2) * Math.cos(Math.atan2(cursorPoint.y - startPoint.y, cursorPoint.x - startPoint.x))
              ]}
              stroke="#000"
              strokeWidth={1}
              dash={[5, 5]}
            />
          </>
        ) : (
          // 弧线墙预览
          endPoint && (
            <>
              {(() => {
                const arcParams = calculateArcParameters(startPoint, cursorPoint, endPoint);
                if (!arcParams) return null;

                return (
                  <>
                    {/* 绘制圆弧 */}
                    <Arc
                      x={arcParams.center.x}
                      y={arcParams.center.y}
                      innerRadius={arcParams.radius - wallThickness / 2}
                      outerRadius={arcParams.radius + wallThickness / 2}
                      angle={arcParams.angle}
                      rotation={arcParams.rotation}
                      fill="#000"
                      opacity={0.1}
                    />
                    {/* 绘制圆弧的边线 */}
                    <Arc
                      x={arcParams.center.x}
                      y={arcParams.center.y}
                      innerRadius={arcParams.radius - wallThickness / 2}
                      outerRadius={arcParams.radius - wallThickness / 2}
                      angle={arcParams.angle}
                      rotation={arcParams.rotation}
                      stroke="#000"
                      dash={[5, 5]}
                    />
                    <Arc
                      x={arcParams.center.x}
                      y={arcParams.center.y}
                      innerRadius={arcParams.radius + wallThickness / 2}
                      outerRadius={arcParams.radius + wallThickness / 2}
                      angle={arcParams.angle}
                      rotation={arcParams.rotation}
                      stroke="#000"
                      dash={[5, 5]}
                    />
                  </>
                );
              })()}
            </>
          )
        )}
      </>
    );
  };

  return (
    <Layer id="wall-drawing-layer" onMouseDown={handleMouseDown} onMouseMove={handleMouseMove}>
      {renderSnapHelpers()}
      {renderWallPreview()}
      {/* 显示尺寸 */}
      {startPoint && currentPoint && cursorPoint && (
        <Text
          x={(startPoint.x + (endPoint ? endPoint.x : cursorPoint.x)) / 2}
          y={(startPoint.y + (endPoint ? endPoint.y : cursorPoint.y)) / 2 - 20}
          text={
            wallType === 'straight'
              ? `长度: ${Math.round(dimensions.length || 0)}px\n宽度: ${wallThickness}px`
              : endPoint
                ? `弧长: ${Math.round(dimensions.length || 0)}px\n半径: ${Math.round(dimensions.radius || 0)}px\n角度: ${Math.round(Math.abs(dimensions.angle || 0))}°\n宽度: ${wallThickness}px`
                : `直线距离: ${Math.round(dimensions.length || 0)}px`
          }
          fontSize={12 / stageScale}
          fill="#000"
          align="center"
        />
      )}
    </Layer>
  );
};

export default WallDrawing; 