import React, { useState } from 'react';
import { Group } from 'react-konva';
import { SpaceElement } from '../../types';
import Konva from 'konva';

// 添加通用的ElementProps接口
export interface ElementProps {
  isSelected?: boolean;
  isHovered?: boolean;
  isDragging?: boolean;
}

interface BaseElementProps {
  element: SpaceElement;
  isDrawingWall: boolean;
  isSelected: boolean;
  onSelect: (elementId: string) => void;
  onDragStart: (e: Konva.KonvaEventObject<DragEvent>, element: SpaceElement) => void;
  onDragEnd: (e: Konva.KonvaEventObject<DragEvent>, element: SpaceElement) => void;
  children: React.ReactNode;
}

export const BaseElement: React.FC<BaseElementProps> = ({
  element,
  isDrawingWall,
  isSelected,
  onSelect,
  onDragStart,
  onDragEnd,
  children
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!isDrawingWall && !isDragging) {
      onSelect(element.id);
      e.cancelBubble = true;
    }
  };

  const handleDragStart = (e: Konva.KonvaEventObject<DragEvent>) => {
    if (!isDrawingWall) {
      setIsDragging(true);
      onDragStart(e, element);
      e.cancelBubble = true;
    }
  };

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    if (!isDrawingWall) {
      setIsDragging(false);
      onDragEnd(e, element);
      e.cancelBubble = true;
    }
  };

  const handleDragMove = (e: Konva.KonvaEventObject<DragEvent>) => {
    if (!isDrawingWall) {
      e.cancelBubble = true;
    }
  };

  const handleMouseEnter = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!isDrawingWall && !isDragging) {
      const stage = e.target.getStage();
      if (stage) stage.container().style.cursor = 'pointer';
      setIsHovered(true);
      e.cancelBubble = true;
    }
  };

  const handleMouseLeave = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!isDrawingWall && !isDragging) {
      const stage = e.target.getStage();
      if (stage) stage.container().style.cursor = 'default';
      setIsHovered(false);
      e.cancelBubble = true;
    }
  };

  return (
    <Group
      x={element.position.x}
      y={element.position.y}
      draggable={!isDrawingWall}
      onClick={handleClick}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, {
            isSelected,
            isHovered,
            isDragging
          } as ElementProps);
        }
        return child;
      })}
    </Group>
  );
}; 