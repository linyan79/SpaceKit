import axios from 'axios';

// 模拟后端API的基础URL
const API_BASE_URL = 'http://localhost:3000';

interface User {
  username: string;
  password: string;
}

// 模拟用户数据存储
const users: User[] = [];

export const authApi = {
  // 注册
  register: async (username: string, password: string) => {
    // 模拟API调用
    const existingUser = users.find(u => u.username === username);
    if (existingUser) {
      throw new Error('用户名已存在');
    }
    
    users.push({ username, password });
    return { success: true, message: '注册成功' };
  },

  // 登录
  login: async (username: string, password: string) => {
    // 模拟API调用
    const user = users.find(u => u.username === username && u.password === password);
    if (!user) {
      throw new Error('用户名或密码错误');
    }
    
    return {
      success: true,
      token: 'mock-jwt-token',
      user: { username }
    };
  }
}; 