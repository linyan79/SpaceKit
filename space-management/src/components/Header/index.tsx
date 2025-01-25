import React, { useState } from 'react';
import { Button, Space, Typography, Modal, Input, message, Switch } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../store/authSlice';
import { createFile, updateFile, clearCurrentFile, fetchFile } from '../../store/fileSlice';
import { RootState, AppDispatch } from '../../store';
import styled from 'styled-components';
import FileDialog from '../FileDialog';
import type { FileListItem } from '../../types/file';
import { undoThunk, redoThunk } from '../../store/commandSlice';
import { UndoOutlined, RedoOutlined } from '@ant-design/icons';
import { setViewMode } from '../../store/spaceSlice';

const HeaderContainer = styled.div`
  padding: 8px 16px;
  background: #fff;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ViewModeSwitch = styled(Space)`
  display: flex;
  align-items: center;
  gap: 8px;
  
  span {
    font-size: 14px;
    color: #666;
  }
`;

const Header: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { currentFile } = useSelector((state: RootState) => state.file);
  const spaceState = useSelector((state: RootState) => state.space);
  const { canUndo, canRedo } = useSelector((state: RootState) => state.command);
  const viewMode = useSelector((state: RootState) => state.space.viewMode);

  const [fileDialogVisible, setFileDialogVisible] = useState(false);
  const [fileDialogMode, setFileDialogMode] = useState<'open' | 'save'>('open');

  const handleViewModeChange = (checked: boolean) => {
    dispatch(setViewMode({ mode: checked ? '3d' : '2d' }));
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const handleNew = () => {
    Modal.confirm({
      title: '新建文件',
      content: '确定要新建文件吗？未保存的更改将会丢失。',
      onOk: () => {
        dispatch(clearCurrentFile());
      },
    });
  };

  const handleOpen = () => {
    setFileDialogMode('open');
    setFileDialogVisible(true);
  };

  const handleSave = async () => {
    if (!currentFile) {
      setFileDialogMode('save');
      setFileDialogVisible(true);
      return;
    }

    try {
      await dispatch(updateFile({
        id: currentFile.id,
        content: {
          elements: spaceState.elements,
        },
      })).unwrap();
      message.success('保存成功');
    } catch (err) {
      message.error('保存失败');
    }
  };

  const handleSaveAs = () => {
    setFileDialogMode('save');
    setFileDialogVisible(true);
  };

  const handleFileSelect = async (file: FileListItem) => {
    try {
      await dispatch(updateFile({
        id: file.id,
        content: {
          elements: spaceState.elements,
        },
      })).unwrap();
      message.success('保存成功');
    } catch (err) {
      message.error('保存失败');
    }
  };

  return (
    <HeaderContainer>
      <Space>
        <Button onClick={handleNew}>新建</Button>
        <Button onClick={handleOpen}>打开</Button>
        <Button onClick={handleSave}>保存</Button>
        <Button onClick={handleSaveAs}>另存为</Button>
        <Button 
          icon={<UndoOutlined />}
          onClick={() => dispatch(undoThunk())}
          disabled={!canUndo}
          title="撤销"
        />
        <Button
          icon={<RedoOutlined />}
          onClick={() => dispatch(redoThunk())}
          disabled={!canRedo}
          title="重做"
        />
      </Space>
      <ViewModeSwitch>
        <span>2D/3D 视图：</span>
        <Switch
          checked={viewMode.mode === '3d'}
          onChange={handleViewModeChange}
          checkedChildren="3D"
          unCheckedChildren="2D"
        />
      </ViewModeSwitch>
      <Space>
        <Typography.Text>欢迎，{user?.username}</Typography.Text>
        <Button onClick={handleLogout}>退出登录</Button>
      </Space>

      <FileDialog
        visible={fileDialogVisible}
        onClose={() => setFileDialogVisible(false)}
        mode={fileDialogMode}
        onSelect={handleFileSelect}
      />
    </HeaderContainer>
  );
};

export default Header; 