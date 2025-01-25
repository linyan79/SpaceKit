import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { fileApi } from '../services/fileApi';
import { SpaceFile, CreateFileParams, UpdateFileParams, FileListItem } from '../types/file';

interface FileState {
  currentFile: SpaceFile | null;
  fileList: FileListItem[];
  loading: boolean;
  error: string | null;
}

const initialState: FileState = {
  currentFile: null,
  fileList: [],
  loading: false,
  error: null,
};

export const fetchFiles = createAsyncThunk(
  'file/fetchFiles',
  async (userId: string) => {
    const response = await fileApi.getFiles(userId);
    return response;
  }
);

export const fetchFile = createAsyncThunk(
  'file/fetchFile',
  async (id: string, { dispatch }) => {
    const response = await fileApi.getFile(id);
    dispatch({ type: 'space/setElements', payload: response.content.elements });
    return response;
  }
);

export const createFile = createAsyncThunk(
  'file/createFile',
  async ({ userId, params }: { userId: string; params: CreateFileParams }) => {
    const response = await fileApi.createFile(userId, params);
    return response;
  }
);

export const updateFile = createAsyncThunk(
  'file/updateFile',
  async (params: UpdateFileParams) => {
    const response = await fileApi.updateFile(params);
    return response;
  }
);

export const deleteFile = createAsyncThunk(
  'file/deleteFile',
  async (id: string) => {
    await fileApi.deleteFile(id);
    return id;
  }
);

const fileSlice = createSlice({
  name: 'file',
  initialState,
  reducers: {
    clearCurrentFile: (state) => {
      state.currentFile = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchFiles
      .addCase(fetchFiles.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFiles.fulfilled, (state, action) => {
        state.loading = false;
        state.fileList = action.payload;
      })
      .addCase(fetchFiles.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || '获取文件列表失败';
      })
      // fetchFile
      .addCase(fetchFile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFile.fulfilled, (state, action) => {
        state.loading = false;
        state.currentFile = action.payload;
      })
      .addCase(fetchFile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || '获取文件失败';
      })
      // createFile
      .addCase(createFile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createFile.fulfilled, (state, action) => {
        state.loading = false;
        state.currentFile = action.payload;
        state.fileList.push({
          id: action.payload.id,
          name: action.payload.name,
          updatedAt: action.payload.updatedAt,
        });
      })
      .addCase(createFile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || '创建文件失败';
      })
      // updateFile
      .addCase(updateFile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateFile.fulfilled, (state, action) => {
        state.loading = false;
        state.currentFile = action.payload;
        const index = state.fileList.findIndex(f => f.id === action.payload.id);
        if (index !== -1) {
          state.fileList[index] = {
            id: action.payload.id,
            name: action.payload.name,
            updatedAt: action.payload.updatedAt,
          };
        }
      })
      .addCase(updateFile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || '更新文件失败';
      })
      // deleteFile
      .addCase(deleteFile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteFile.fulfilled, (state, action) => {
        state.loading = false;
        if (state.currentFile?.id === action.payload) {
          state.currentFile = null;
        }
        state.fileList = state.fileList.filter(f => f.id !== action.payload);
      })
      .addCase(deleteFile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || '删除文件失败';
      });
  },
});

export const { clearCurrentFile, clearError } = fileSlice.actions;
export default fileSlice.reducer; 