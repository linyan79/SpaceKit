import React from 'react';
import { Layout } from 'antd';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from './store';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import Canvas from './components/Canvas';
import ElementPanel from './components/ElementPanel';
import { PropertyPanel } from './components/PropertyPanel/PropertyPanel';
import Header from './components/Header';

const { Sider, Content } = Layout;

const MainLayout: React.FC = () => {
  const selectedElements = useSelector((state: RootState) => state.space.selectedElements);
  const elements = useSelector((state: RootState) => state.space.elements);
  const selectedElement = elements.find(el => selectedElements.includes(el.id)) || null;

  return (
    <Layout style={{ height: '100vh' }}>
      <Header />
      <Layout>
        <Sider width={200} theme="light">
          <ElementPanel />
        </Sider>
        <Content>
          <Canvas />
        </Content>
        <Sider width={300} theme="light">
          <PropertyPanel selectedElement={selectedElement} />
        </Sider>
      </Layout>
    </Layout>
  );
};

const PrivateRoute: React.FC<{ element: React.ReactElement }> = ({ element }) => {
  const { token } = useSelector((state: RootState) => state.auth);
  return token ? element : <Navigate to="/login" />;
};

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/"
          element={<PrivateRoute element={<MainLayout />} />}
        />
      </Routes>
    </Router>
  );
};

export default App; 