import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import {
  setSelectedElements,
  setHoveredElement,
  addElement,
  updateElement,
  deleteElement,
  setElements,
} from '../store/spaceSlice';
import { useState, useEffect } from 'react';
import { Stage, Layer } from 'react-konva';
import { executeAndRecord } from '../utils/commandUtils';
import { AddElementCommandImpl, DeleteElementCommandImpl } from '../commands/elementCommands';
import { SpaceElement } from '../types/space';

const Canvas2D: React.FC = () => {
  const dispatch = useDispatch();
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const selectedElements = useSelector((state: RootState) => state.space.selectedElements);
  const hoveredElement = useSelector((state: RootState) => state.space.hoveredElement);
  const elements = useSelector((state: RootState) => state.space.elements);

  const handleElementClick = (elementId: string) => {
    if (!isDrawingMode) {
      dispatch(setSelectedElements([elementId]));
    }
  };

  const handleCanvasClick = () => {
    if (!isDrawingMode) {
      dispatch(setSelectedElements([]));
    }
  };

  const handleElementSelect = (elementIds: string[]) => {
    dispatch(setSelectedElements(elementIds));
  };

  const handleElementHover = (elementId: string | null) => {
    if (!isDrawingMode) {
      dispatch(setHoveredElement(elementId));
    }
  };

  return (
    <Stage width={window.innerWidth} height={window.innerHeight} onClick={handleCanvasClick}>
      <Layer>
        {/* 图元渲染代码将在这里添加 */}
      </Layer>
    </Stage>
  );
};

export default Canvas2D; 