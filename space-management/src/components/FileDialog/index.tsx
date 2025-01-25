import React, { useEffect } from 'react';
import { Modal, Table, Button, Space, message, Input, Form } from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { fetchFiles, fetchFile, deleteFile, createFile, updateFile } from '../../store/fileSlice';
import type { FileListItem } from '../../types/file';
import dayjs from 'dayjs';

interface FileDialogProps {
  visible: boolean;
  onClose: () => void;
  mode: 'open' | 'save';
  onSelect?: (file: FileListItem) => void;
}

const FileDialog: React.FC<FileDialogProps> = ({
  visible,
  onClose,
  mode,
  onSelect,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { fileList, loading } = useSelector((state: RootState) => state.file);
  const spaceState = useSelector((state: RootState) => state.space);
  const [form] = Form.useForm();

  useEffect(() => {
    if (visible && user) {
      dispatch(fetchFiles(user.username));
    }
  }, [visible, user, dispatch]);

  const handleDelete = async (id: string) => {
    try {
      await dispatch(deleteFile(id)).unwrap();
      message.success('删除成功');
      // 重新加载文件列表
      if (user) {
        dispatch(fetchFiles(user.username));
      }
    } catch (err: any) {
      message.error(err?.message || '删除失败');
    }
  };

  const handleSaveNew = async () => {
    if (!user) {
      message.error('请先登录');
      return;
    }

    try {
      const values = await form.validateFields();
      const result = await dispatch(createFile({
        userId: user.username,
        params: {
          name: values.fileName,
          content: {
            elements: spaceState.elements,
          },
        },
      })).unwrap();

      message.success('保存成功');
      // 重新加载文件列表
      dispatch(fetchFiles(user.username));
      onClose();
      form.resetFields();
    } catch (err: any) {
      if (err?.errorFields) {
        // 表单验证错误
        return;
      }
      message.error(err?.message || '保存失败');
    }
  };

  const handleSaveExisting = async (file: FileListItem) => {
    try {
      await dispatch(updateFile({
        id: file.id,
        content: {
          elements: spaceState.elements,
        },
      })).unwrap();
      message.success('保存成功');
      // 重新加载文件列表
      if (user) {
        dispatch(fetchFiles(user.username));
      }
      onClose();
    } catch (err: any) {
      message.error(err?.message || '保存失败');
    }
  };

  const handleSelect = async (file: FileListItem) => {
    if (mode === 'open') {
      try {
        await dispatch(fetchFile(file.id)).unwrap();
        message.success('打开成功');
        onClose();
      } catch (err: any) {
        message.error(err?.message || '打开失败');
      }
    } else {
      Modal.confirm({
        title: '确认覆盖',
        content: `确定要覆盖文件"${file.name}"吗？`,
        onOk: () => handleSaveExisting(file),
      });
    }
  };

  const columns = [
    {
      title: '文件名',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '最后修改时间',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      render: (text: string) => dayjs(text).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: FileListItem) => (
        <Space size="middle">
          <Button
            type="link"
            onClick={() => handleSelect(record)}
          >
            {mode === 'open' ? '打开' : '覆盖保存'}
          </Button>
          <Button
            type="link"
            danger
            onClick={() => {
              Modal.confirm({
                title: '确认删除',
                content: `确定要删除文件"${record.name}"吗？`,
                onOk: () => handleDelete(record.id),
              });
            }}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Modal
      title={mode === 'open' ? '打开文件' : '保存文件'}
      open={visible}
      onCancel={onClose}
      footer={mode === 'save' ? [
        <Button key="cancel" onClick={onClose}>取消</Button>,
        <Button key="save" type="primary" onClick={handleSaveNew}>
          保存为新文件
        </Button>,
      ] : null}
      width={800}
    >
      {mode === 'save' && (
        <Form form={form} layout="vertical" style={{ marginBottom: 16 }}>
          <Form.Item
            name="fileName"
            label="文件名"
            rules={[{ required: true, message: '请输入文件名' }]}
          >
            <Input placeholder="请输入文件名" />
          </Form.Item>
        </Form>
      )}
      {mode === 'save' && (
        <div style={{ marginBottom: 16 }}>
          <h4>或选择一个已有文件进行覆盖：</h4>
        </div>
      )}
      <Table
        columns={columns}
        dataSource={fileList}
        rowKey="id"
        loading={loading}
      />
    </Modal>
  );
};

export default FileDialog; 