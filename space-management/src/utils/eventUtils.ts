import { SpaceElement, ElementType } from '../types';
import Konva from 'konva';

// 处理图元拖拽开始
export const handleElementDragStart = (
  e: Konva.KonvaEventObject<DragEvent>,
  element: SpaceElement,
  selectedElementIds: string[],
  onSelect: (elementId: string) => void
) => {
  e.cancelBubble = true;
  // 如果图元已经被选中，不需要再次设置选中状态
  if (!selectedElementIds.includes(element.id)) {
    onSelect(element.id);
  }
};

// 处理图元拖拽结束
export const handleElementDragEnd = (
  e: Konva.KonvaEventObject<DragEvent>,
  element: SpaceElement,
  onUpdate: (updatedElement: SpaceElement) => void
) => {
  e.cancelBubble = true;
  const groupNode = e.target;
  const position = groupNode.getPosition();
  
  onUpdate({
    ...element,
    position: {
      ...element.position,
      x: position.x,
      y: position.y
    }
  });
};

// 处理图元拖放
export const handleElementDrop = (
  e: React.DragEvent,
  elementType: ElementType,
  onAddElement: (element: SpaceElement) => void,
  onStartWallDrawing: () => void
) => {
  e.preventDefault();
  
  if (elementType === 'wall') {
    onStartWallDrawing();
    return;
  }
  
  const stage = e.target as HTMLDivElement;
  const stageRect = stage.getBoundingClientRect();
  const x = e.clientX - stageRect.left;
  const y = e.clientY - stageRect.top;

  // 创建新图元的默认属性
  const defaultDimensions = elementType === 'seat'
    ? { width: 120, height: 50, depth: 100 }  // 工位默认尺寸
    : { width: 2, height: 0.1, depth: 2 };    // 其他图元默认尺寸

  const newElement: SpaceElement = {
    id: crypto.randomUUID(),
    type: elementType,
    position: { x, y, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    dimensions: defaultDimensions,
    properties: {},
  };

  onAddElement(newElement);
}; 