import React from 'react';
import { Rect, Circle, Line } from 'react-konva';
import { SeatElement as ISeatElement } from '../../types';
import { ELEMENT_COLORS } from '../../utils/elementUtils';
import { BaseElement, ElementProps } from './BaseElement';
import Konva from 'konva';

interface SeatElementProps {
  element: ISeatElement;
  isDrawingWall: boolean;
  isSelected: boolean;
  onSelect: (elementId: string) => void;
  onDragStart: (e: Konva.KonvaEventObject<DragEvent>, element: ISeatElement) => void;
  onDragEnd: (e: Konva.KonvaEventObject<DragEvent>, element: ISeatElement) => void;
}

interface SeatShapeProps extends ElementProps {
  width: number;
  depth: number;
  deskDepth: number;
}

const SeatShape: React.FC<SeatShapeProps> = ({
  width,
  depth,
  deskDepth,
  isSelected,
  isHovered
}) => {
  return (
    <>
      {/* 工位空间范围 */}
      <Rect
        x={-width / 2}
        y={-depth / 2}
        width={width}
        height={depth}
        stroke={isSelected ? ELEMENT_COLORS.SEAT.BORDER_SELECTED : ELEMENT_COLORS.SEAT.BORDER_DEFAULT}
        strokeWidth={1}
        dash={[5, 5]}
        opacity={0.5}
        fill={isSelected ? ELEMENT_COLORS.SEAT.SELECTED : (isHovered ? ELEMENT_COLORS.SEAT.HOVER : ELEMENT_COLORS.SEAT.DEFAULT)}
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
    </>
  );
};

export const SeatElementComponent: React.FC<SeatElementProps> = ({
  element,
  isDrawingWall,
  isSelected,
  onSelect,
  onDragStart,
  onDragEnd
}) => {
  const { width, depth } = element.dimensions;
  const deskDepth = 50;

  const handleDragStart = (e: Konva.KonvaEventObject<DragEvent>) => {
    onDragStart(e, element);
  };

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    onDragEnd(e, element);
  };

  return (
    <BaseElement
      element={element}
      isDrawingWall={isDrawingWall}
      isSelected={isSelected}
      onSelect={onSelect}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SeatShape
        width={width}
        depth={depth}
        deskDepth={deskDepth}
      />
    </BaseElement>
  );
}; 