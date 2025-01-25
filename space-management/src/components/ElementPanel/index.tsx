import { Card } from 'antd';
import styled from 'styled-components';
import { ElementType } from '../../types/space';
import { useDispatch } from 'react-redux';

const PanelContainer = styled.div`
  padding: 16px;
  height: 100%;
  overflow-y: auto;
`;

const DraggableElement = styled.div`
  padding: 12px;
  margin-bottom: 8px;
  border: 1px solid #f0f0f0;
  border-radius: 4px;
  cursor: pointer;
  user-select: none;
  transition: all 0.3s;
  
  &:hover {
    background-color: #f5f5f5;
    border-color: #1890ff;
  }
  
  &:active {
    background-color: #e6f7ff;
  }
`;

const elementTypes: { type: ElementType; label: string }[] = [
  { type: 'seat', label: '座位' },
  { type: 'meetingRoom', label: '会议室' },
  { type: 'door', label: '门' },
  { type: 'window', label: '窗' },
  { type: 'wall', label: '墙' },
];

const ElementPanel = () => {
  const dispatch = useDispatch();

  const handleDragStart = (e: React.DragEvent, type: ElementType) => {
    e.dataTransfer.setData('elementType', type);
  };

  const handleClick = (type: ElementType) => {
    // 如果是墙体，触发绘制状态
    if (type === 'wall') {
      const event = new CustomEvent('startWallDrawing', {
        detail: { wallType: 'straight' },
        bubbles: true,
        cancelable: true
      });
      document.dispatchEvent(event);
      console.log('Wall drawing event dispatched');
    }
  };

  return (
    <PanelContainer>
      <Card title="空间元素" bordered={false}>
        {elementTypes.map(({ type, label }) => (
          <DraggableElement
            key={type}
            draggable
            onDragStart={(e) => handleDragStart(e, type)}
            onClick={() => handleClick(type)}
          >
            {label}
          </DraggableElement>
        ))}
      </Card>
    </PanelContainer>
  );
};

export default ElementPanel; 