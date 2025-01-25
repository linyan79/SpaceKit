import React from 'react';
import { Form, Input, Button, Card, message, Space } from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '../../store/authSlice';
import { AppDispatch, RootState } from '../../store';
import styled from 'styled-components';

const LoginContainer = styled.div`
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

const Login: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { loading, error } = useSelector((state: RootState) => state.auth);

  const onFinish = async (values: { username: string; password: string }) => {
    try {
      await dispatch(login(values)).unwrap();
      void message.success('登录成功');
      navigate('/');
    } catch (err) {
      void message.error(error || '登录失败');
    }
  };

  return (
    <LoginContainer>
      <StyledCard title="登录">
        <Form
          name="login"
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

          <ActionContainer>
            <Button type="primary" htmlType="submit" loading={loading}>
              登录
            </Button>
            <Link to="/register">还没有账号？立即注册</Link>
          </ActionContainer>
        </Form>
      </StyledCard>
    </LoginContainer>
  );
};

export default Login;
