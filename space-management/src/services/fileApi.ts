import axios from 'axios';
import { SpaceFile, CreateFileParams, UpdateFileParams, FileListItem } from '../types/file';

const API_BASE_URL = 'http://localhost:3001/api';

// 添加本地存储支持
const LOCAL_STORAGE_KEY = 'space_management_files';

// 从本地存储获取数据
const getLocalFiles = (): FileListItem[] => {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error reading from localStorage:', error);
    return [];
  }
};

// 保存数据到本地存储
const saveLocalFiles = (files: FileListItem[]) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(files));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
};

export const fileApi = {
  // 获取文件列表
  getFiles: async (userId: string): Promise<FileListItem[]> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/files/${userId}`);
      const files = response.data;
      saveLocalFiles(files); // 保存到本地
      return files;
    } catch (error) {
      console.warn('Failed to fetch files from server, using local data:', error);
      return getLocalFiles();
    }
  },

  // 获取文件详情
  getFile: async (id: string): Promise<SpaceFile> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/files/detail/${id}`);
      return response.data;
    } catch (error) {
      console.warn('Failed to fetch file details:', error);
      // 从本地存储获取文件详情
      const files = getLocalFiles();
      const file = files.find(f => f.id === id);
      if (!file) {
        throw new Error('File not found');
      }
      return file as SpaceFile;
    }
  },

  // 创建新文件
  createFile: async (userId: string, params: CreateFileParams): Promise<SpaceFile> => {
    try {
      const response = await axios.post(`${API_BASE_URL}/files`, { userId, params });
      const newFile = response.data;
      // 更新本地存储
      const files = getLocalFiles();
      files.push(newFile);
      saveLocalFiles(files);
      return newFile;
    } catch (error) {
      console.warn('Failed to create file on server, saving locally:', error);
      const newFile: SpaceFile = {
        id: Date.now().toString(),
        userId,
        ...params,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const files = getLocalFiles();
      files.push(newFile);
      saveLocalFiles(files);
      return newFile;
    }
  },

  // 更新文件
  updateFile: async (params: UpdateFileParams): Promise<SpaceFile> => {
    try {
      const response = await axios.put(`${API_BASE_URL}/files/${params.id}`, params);
      const updatedFile = response.data;
      // 更新本地存储
      const files = getLocalFiles();
      const index = files.findIndex(f => f.id === params.id);
      if (index !== -1) {
        files[index] = updatedFile;
        saveLocalFiles(files);
      }
      return updatedFile;
    } catch (error) {
      console.warn('Failed to update file on server, updating locally:', error);
      const files = getLocalFiles();
      const index = files.findIndex(f => f.id === params.id);
      if (index === -1) {
        throw new Error('File not found');
      }
      const updatedFile = {
        ...files[index],
        ...params,
        updatedAt: new Date().toISOString(),
      };
      files[index] = updatedFile;
      saveLocalFiles(files);
      return updatedFile as SpaceFile;
    }
  },

  // 删除文件
  deleteFile: async (id: string): Promise<void> => {
    try {
      await axios.delete(`${API_BASE_URL}/files/${id}`);
      // 更新本地存储
      const files = getLocalFiles();
      const index = files.findIndex(f => f.id === id);
      if (index !== -1) {
        files.splice(index, 1);
        saveLocalFiles(files);
      }
    } catch (error) {
      console.warn('Failed to delete file on server, deleting locally:', error);
      const files = getLocalFiles();
      const index = files.findIndex(f => f.id === id);
      if (index !== -1) {
        files.splice(index, 1);
        saveLocalFiles(files);
      }
    }
  },
}; 