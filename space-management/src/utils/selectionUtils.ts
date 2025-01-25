import { Point, SpaceElement } from '../types';
import { isElementSelected } from './elementUtils';

export interface SelectionBox {
  start: Point;
  end: Point;
  isSelecting: boolean;
  isLeftToRight: boolean;
}

// 处理框选状态更新
export const updateSelectionBox = (
  currentPoint: Point,
  startPoint: Point
): SelectionBox => ({
  start: startPoint,
  end: currentPoint,
  isSelecting: true,
  isLeftToRight: currentPoint.x > startPoint.x && currentPoint.y > startPoint.y
});

// 获取框选的图元
export const getSelectedElements = (
  elements: SpaceElement[],
  selectionBox: SelectionBox
): SpaceElement[] => {
  if (!selectionBox?.isSelecting) return [];
  return elements.filter(element => isElementSelected(element, selectionBox));
};

// 判断是否应该启动框选
export const shouldStartSelection = (
  e: any,
  isDrawingWall: boolean,
  selectedElementIds: string[]
): boolean => {
  // 如果正在绘制墙或有选中的图元，不启动框选
  if (isDrawingWall || selectedElementIds.length > 0) return false;
  
  // 只有点击舞台本身（空白区域）时才启动框选
  return e.target === e.target.getStage();
}; 