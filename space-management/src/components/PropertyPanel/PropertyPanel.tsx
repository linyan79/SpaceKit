import React, { useEffect } from 'react';
import { Form, Input, InputNumber, Select, Switch, Card } from 'antd';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { SpaceElement, WallElement, SeatElement, DoorElement, WindowElement } from '../../types';
import { setElements, updateElement, updateSnapConfig } from '../../store/spaceSlice';
import { updateWallConnections } from '../../utils/wallConnectionManager';
import styled from 'styled-components';

const { Option } = Select;

const PanelContainer = styled.div`
  padding: 16px;
  height: 100%;
  overflow-y: auto;
`;

export const PropertyPanel: React.FC = () => {
  const dispatch = useDispatch();
  const [form] = Form.useForm();
  const selectedElements = useSelector((state: RootState) => state.space.selectedElements);
  const elements = useSelector((state: RootState) => state.space.elements);
  const snapConfig = useSelector((state: RootState) => state.space.snapConfig);
  const selectedElementsList = elements.filter((el: SpaceElement) => selectedElements.includes(el.id));

  // 当选中元素改变时重置表单
  useEffect(() => {
    if (selectedElementsList.length > 0) {
      // 使用第一个元素的属性作为初始值
      const firstElement = selectedElementsList[0];
      const initialValues = {
        ...firstElement.properties,
        ...firstElement.dimensions,
      };
      form.setFieldsValue(initialValues);
    }
  }, [selectedElementsList, form]);

  if (selectedElementsList.length === 0) {
    return (
      <PanelContainer>
        <Card title="属性面板" bordered={false}>
          <p>请选择一个元素查看属性</p>
        </Card>
      </PanelContainer>
    );
  }

  // 检查所有选中的元素是否为同一类型
  const firstType = selectedElementsList[0].type;
  const allSameType = selectedElementsList.every(element => element.type === firstType);
  if (!allSameType) {
    return (
      <PanelContainer>
        <Card title="属性面板" bordered={false}>
          <p>请选择相同类型的图元进行编辑</p>
        </Card>
      </PanelContainer>
    );
  }

  const handleValueChange = (changedValues: any) => {
    // 更新所有选中的元素
    const updatedElements = elements.map((element: SpaceElement) => {
      if (!selectedElements.includes(element.id)) {
        return element;
      }

      // 根据属性类型进行不同的处理
      if (changedValues.height || changedValues.width || changedValues.depth) {
        // 处理尺寸变更
        return {
          ...element,
          dimensions: {
            ...element.dimensions,
            ...(changedValues.height && { height: changedValues.height }),
            ...(changedValues.width && { width: changedValues.width }),
            ...(changedValues.depth && { depth: changedValues.depth })
          }
        };
      } else if (changedValues.thickness && element.type === 'wall') {
        // 处理墙体厚度变更
        const updatedWall = {
          ...element,
          properties: {
            ...element.properties,
            thickness: Math.max(1, Math.min(100, changedValues.thickness))
          }
        };
        return updatedWall;
      } else {
        // 处理其他属性变更
        return {
          ...element,
          properties: {
            ...element.properties,
            ...changedValues
          }
        };
      }
    });
    
    // 如果修改了墙体厚度，需要更新所有墙体的连接
    if (changedValues.thickness) {
      const wallElements = updatedElements.filter(el => el.type === 'wall') as WallElement[];
      const updatedWalls = updateWallConnections(wallElements);
      // 更新所有墙体
      dispatch(setElements(updatedElements.map(el => 
        el.type === 'wall' ? updatedWalls.find(w => w.id === el.id) || el : el
      )));
    } else {
      // 其他属性变更直接更新
      dispatch(setElements(updatedElements));
    }
  };

  const renderWallProperties = (element: WallElement) => {
    const { properties } = element;
    return (
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          ...properties,
          height: element.dimensions.height
        }}
        onValuesChange={handleValueChange}
      >
        <Form.Item label="墙体厚度" name="thickness">
          <InputNumber min={1} max={1000} />
        </Form.Item>
        <Form.Item label="墙体高度" name="height">
          <InputNumber min={1} max={5000} defaultValue={200} />
        </Form.Item>
        <Form.Item label="玻璃隔断" name="isGlass" valuePropName="checked">
          <Switch />
        </Form.Item>
        {properties.type === 'arc' && (
          <>
            <Form.Item label="半径" name="radius">
              <InputNumber min={1} />
            </Form.Item>
            <Form.Item label="起始角度" name="startAngle">
              <InputNumber />
            </Form.Item>
            <Form.Item label="结束角度" name="endAngle">
              <InputNumber />
            </Form.Item>
          </>
        )}
      </Form>
    );
  };

  const renderSeatProperties = (element: SeatElement) => {
    const { properties, dimensions } = element;
    return (
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          ...properties,
          width: dimensions.width,
          depth: dimensions.depth,
        }}
        onValuesChange={handleValueChange}
      >
        <Form.Item label="位置">
          <Input.Group compact>
            <Form.Item label="X">
              <InputNumber value={element.position.x} disabled />
            </Form.Item>
            <Form.Item label="Y">
              <InputNumber value={element.position.y} disabled />
            </Form.Item>
          </Input.Group>
        </Form.Item>
        <Form.Item label="尺寸">
          <Input.Group compact>
            <Form.Item label="宽度" name="width">
              <InputNumber min={60} max={200} />
            </Form.Item>
            <Form.Item label="深度" name="depth">
              <InputNumber min={60} max={200} />
            </Form.Item>
          </Input.Group>
        </Form.Item>
        <Form.Item label="座位编号" name="seatNumber">
          <Input />
        </Form.Item>
        <Form.Item label="是否占用" name="isOccupied">
          <Switch />
        </Form.Item>
        <Form.Item label="所属部门" name="department">
          <Input />
        </Form.Item>
      </Form>
    );
  };

  const renderDoorProperties = (element: DoorElement) => {
    const { properties } = element;
    return (
      <Form
        form={form}
        layout="vertical"
        initialValues={properties}
        onValuesChange={handleValueChange}
      >
        <Form.Item label="门类型" name="doorType">
          <Select>
            <Option value="single">单开门</Option>
            <Option value="double">双开门</Option>
            <Option value="sliding">推拉门</Option>
          </Select>
        </Form.Item>
        <Form.Item label="开门方向" name="openDirection">
          <Select>
            <Option value="left">向左</Option>
            <Option value="right">向右</Option>
          </Select>
        </Form.Item>
        <Form.Item label="自动门" name="isAutomatic">
          <Switch />
        </Form.Item>
      </Form>
    );
  };

  const renderWindowProperties = (element: WindowElement) => {
    const { properties } = element;
    return (
      <Form
        form={form}
        layout="vertical"
        initialValues={properties}
        onValuesChange={handleValueChange}
      >
        <Form.Item label="窗户类型" name="windowType">
          <Select>
            <Option value="fixed">固定窗</Option>
            <Option value="sliding">推拉窗</Option>
            <Option value="casement">平开窗</Option>
          </Select>
        </Form.Item>
        <Form.Item label="玻璃类型" name="glassType">
          <Select>
            <Option value="clear">透明</Option>
            <Option value="frosted">磨砂</Option>
            <Option value="tinted">有色</Option>
          </Select>
        </Form.Item>
        <Form.Item label="是否有格栅" name="hasGrills">
          <Switch />
        </Form.Item>
      </Form>
    );
  };

  const renderProperties = () => {
    const element = selectedElementsList[0]; // 使用第一个元素作为模板
    switch (element.type) {
      case 'wall':
        return renderWallProperties(element as WallElement);
      case 'seat':
        return renderSeatProperties(element as SeatElement);
      case 'door':
        return renderDoorProperties(element as DoorElement);
      case 'window':
        return renderWindowProperties(element as WindowElement);
      default:
        return null;
    }
  };

  return (
    <PanelContainer>
      <Card title={`属性面板 (已选中 ${selectedElementsList.length} 个图元)`} bordered={false}>
        {renderProperties()}
      </Card>

      <Card title="捕捉设置" bordered={false} style={{ marginTop: 16 }}>
        <Form layout="vertical">
          <Form.Item label="捕捉误差">
            <InputNumber
              value={snapConfig.snapDistance}
              onChange={(value: number | null) => dispatch(updateSnapConfig({ snapDistance: value || 1 }))}
              min={1}
              max={50}
            />
          </Form.Item>
        </Form>
      </Card>
    </PanelContainer>
  );
}; 