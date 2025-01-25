import { useDispatch } from 'react-redux';
import { SpaceElement } from '../../types/space';
import { setSelectedElements } from '../../store/spaceSlice';
import { WallProperties } from '../../types/wall';

interface Element3DProps {
  element: SpaceElement;
}

const Element3D = ({ element }: Element3DProps) => {
  const dispatch = useDispatch();

  const handleClick = () => {
    dispatch(setSelectedElements([element.id]));
  };

  if (element.type === 'wall') {
    const wall = element.properties as WallProperties;
    if (wall.type === 'straight') {
      // 计算墙体的方向向量
      const dx = wall.endPoint.x - wall.startPoint.x;
      const dy = wall.endPoint.y - wall.startPoint.y;
      const length = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx);

      // 计算墙体中心点
      const centerX = (wall.startPoint.x + wall.endPoint.x) / 2;
      const centerY = (wall.startPoint.y + wall.endPoint.y) / 2;

      return (
        <mesh
          position={[centerX, 150, centerY]}
          rotation={[0, -angle, 0]}
          onClick={handleClick}
        >
          <boxGeometry args={[length, 300, wall.thickness]} />
          <meshStandardMaterial 
            color="#1890ff"
            transparent={true}
            opacity={0.5}
          />
        </mesh>
      );
    }
    // 弧形墙暂不处理
    return null;
  }

  if (element.type === 'seat') {
    const { width, depth } = element.dimensions;
    const deskHeight = 75; // 标准办公桌高度

    return (
      <group
        position={[element.position.x, 0, element.position.y]}
        onClick={handleClick}
      >
        {/* 桌面 */}
        <mesh position={[0, deskHeight, 0]}>
          <boxGeometry args={[width, 2, depth]} />
          <meshStandardMaterial color="#f0f0f0" />
        </mesh>
        {/* 桌腿 */}
        <mesh position={[-width/2 + 20, deskHeight/2, -depth/2 + 20]}>
          <boxGeometry args={[4, deskHeight, 4]} />
          <meshStandardMaterial color="#666666" />
        </mesh>
        <mesh position={[width/2 - 20, deskHeight/2, -depth/2 + 20]}>
          <boxGeometry args={[4, deskHeight, 4]} />
          <meshStandardMaterial color="#666666" />
        </mesh>
        <mesh position={[-width/2 + 20, deskHeight/2, depth/2 - 20]}>
          <boxGeometry args={[4, deskHeight, 4]} />
          <meshStandardMaterial color="#666666" />
        </mesh>
        <mesh position={[width/2 - 20, deskHeight/2, depth/2 - 20]}>
          <boxGeometry args={[4, deskHeight, 4]} />
          <meshStandardMaterial color="#666666" />
        </mesh>
      </group>
    );
  }

  return null;
};

export default Element3D; 