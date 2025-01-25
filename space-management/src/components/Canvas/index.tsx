import { useSelector } from 'react-redux';
import styled from 'styled-components';
import { RootState } from '../../store';
import Canvas2D from './Canvas2D';
import Canvas3D from './Canvas3D';

const CanvasContainer = styled.div`
  width: 100%;
  height: 100%;
  position: relative;
`;

const Canvas = () => {
  const viewMode = useSelector((state: RootState) => state.space.viewMode);

  return (
    <CanvasContainer>
      {viewMode.mode === '2d' ? <Canvas2D /> : <Canvas3D />}
    </CanvasContainer>
  );
};

export default Canvas; 