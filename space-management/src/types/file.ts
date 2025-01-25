export interface SpaceFile {
  id: string;
  name: string;
  userId: string;
  content: {
    elements: any[];
    // 其他需要保存的状态
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateFileParams {
  name: string;
  content: SpaceFile['content'];
}

export interface UpdateFileParams {
  id: string;
  name?: string;
  content?: SpaceFile['content'];
}

export interface FileListItem {
  id: string;
  name: string;
  updatedAt: string;
} 