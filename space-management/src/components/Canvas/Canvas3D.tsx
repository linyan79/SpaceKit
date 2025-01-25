import { Canvas as ThreeCanvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, OrthographicCamera } from '@react-three/drei';
import { useSelector } from 'react-redux';
import { useState, useRef } from 'react';
import { RootState } from '../../store';
import Element3D from './Element3D';
import { Button, Space } from 'antd';
import { CameraOutlined, FullscreenOutlined } from '@ant-design/icons';
import { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import * as THREE from 'three';

const Canvas3D = () => {
  const elements = useSelector((state: RootState) => state.space.elements);
  const [isPerspective, setIsPerspective] = useState(true);
  const orbitControlsRef = useRef<OrbitControlsImpl>(null);
  const cameraPositionRef = useRef<THREE.Vector3>(new THREE.Vector3(100, 100, 100));
  const cameraTargetRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));

  const toggleCamera = () => {
    if (orbitControlsRef.current) {
      // 保存当前相机位置和目标点
      cameraPositionRef.current.copy(orbitControlsRef.current.object.position);
      cameraTargetRef.current.copy(orbitControlsRef.current.target);
    }
    setIsPerspective(!isPerspective);
  };

  const calculateSceneRadius = () => {
    let maxDistance = 0;
    elements.forEach(element => {
      if (element.type === 'wall') {
        const wall = element.properties as any;
        if (wall.type === 'straight') {
          const points = [
            new THREE.Vector3(wall.startPoint.x, 0, wall.startPoint.y),
            new THREE.Vector3(wall.endPoint.x, 0, wall.endPoint.y),
            new THREE.Vector3(wall.startPoint.x, 300, wall.startPoint.y),
            new THREE.Vector3(wall.endPoint.x, 300, wall.endPoint.y)
          ];
          points.forEach(point => {
            maxDistance = Math.max(maxDistance, point.length());
          });
        }
      } else if (element.type === 'seat') {
        const pos = new THREE.Vector3(element.position.x, 75, element.position.y);
        maxDistance = Math.max(maxDistance, pos.length());
      }
    });
    return maxDistance || 100; // 默认半径100
  };

  const handleZoomAll = () => {
    if (orbitControlsRef.current) {
      const camera = orbitControlsRef.current.object;
      const currentDirection = new THREE.Vector3();
      camera.getWorldDirection(currentDirection);
      
      if (isPerspective) {
        // 计算场景半径
        const sceneRadius = calculateSceneRadius();
        
        // 根据视锥体角度计算所需距离
        const fov = (camera as THREE.PerspectiveCamera).fov;
        const halfFov = THREE.MathUtils.degToRad(fov / 2);
        const distance = (sceneRadius * 2) / Math.tan(halfFov);
        
        // 保持当前相机方向，只调整距离
        const targetPosition = orbitControlsRef.current.target.clone()
          .add(currentDirection.multiplyScalar(-distance));
        camera.position.copy(targetPosition);
      } else {
        // 正交相机逻辑保持不变
        const distance = 100;
        const targetPosition = new THREE.Vector3(0, 50, 0)
          .add(currentDirection.multiplyScalar(-distance));
        camera.position.copy(targetPosition);
        
        const orthoCam = camera as THREE.OrthographicCamera;
        if (orthoCam.zoom) {
          orthoCam.zoom = 2;
          orthoCam.updateProjectionMatrix();
        }
      }
      
      // 更新控制器
      orbitControlsRef.current.update();
    }
  };

  const renderElements = () => {
    return elements.map((element) => (
      <Element3D key={element.id} element={element} />
    ));
  };

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 1000 }}>
        <Space>
          <Button 
            icon={<FullscreenOutlined />}
            onClick={handleZoomAll}
            title="Zoom All"
          >
            Zoom All
          </Button>
          <Button 
            icon={<CameraOutlined />} 
            onClick={toggleCamera}
            title={`Switch to ${isPerspective ? 'Orthographic' : 'Perspective'} View`}
          >
            {isPerspective ? 'Perspective' : 'Orthographic'}
          </Button>
        </Space>
      </div>
      
      <ThreeCanvas style={{ width: '100%', height: '100%' }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <gridHelper args={[100, 100]} position={[0, 0, 0]} />
        <OrbitControls 
          ref={orbitControlsRef}
          makeDefault 
          minDistance={10}
          maxDistance={1000}
          target={cameraTargetRef.current}
        />
        {renderElements()}
        
        {isPerspective ? (
          <PerspectiveCamera
            makeDefault
            position={cameraPositionRef.current}
            fov={50}
            near={0.1}
            far={5000}
          />
        ) : (
          <OrthographicCamera
            makeDefault
            position={cameraPositionRef.current}
            zoom={2}
            left={-5000}
            right={5000}
            top={5000}
            bottom={-5000}
            near={-5000}
            far={5000}
          />
        )}
      </ThreeCanvas>
    </div>
  );
};

export default Canvas3D; 