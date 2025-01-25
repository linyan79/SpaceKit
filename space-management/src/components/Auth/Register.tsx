import React from 'react';
import { Form, Input, Button, Card, message } from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '../../store/authSlice';
import { AppDispatch, RootState } from '../../store';
import styled from 'styled-components';

const RegisterContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f0f2f5;
`;

const StyledCard = styled(Card)`
  width: 400px;
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
`;

const ActionContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Register: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { loading, error } = useSelector((state: RootState) => state.auth);

  const onFinish = async (values: { username: string; password: string; confirm: string }) => {
    if (values.password !== values.confirm) {
      message.error('两次输入的密码不一致');
      return;
    }

    try {
      await dispatch(register({ username: values.username, password: values.password })).unwrap();
      message.success('注册成功');
      navigate('/login');
    } catch (err) {
      message.error(error || '注册失败');
    }
  };

  return (
    <RegisterContainer>
      <StyledCard title="注册">
        <Form
          name="register"
          onFinish={onFinish}
          autoComplete="off"
          layout="vertical"
        >
          <Form.Item
            label="用户名"
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="密码"
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password />
          </Form.Item>

          <Form.Item
            label="确认密码"
            name="confirm"
            rules={[{ required: true, message: '请确认密码' }]}
          >
            <Input.Password />
          </Form.Item>

          <ActionContainer>
            <Button type="primary" htmlType="submit" loading={loading}>
              注册
            </Button>
            <Link to="/login">已有账号？立即登录</Link>
          </ActionContainer>
        </Form>
      </StyledCard>
    </RegisterContainer>
  );
};

export default Register; 