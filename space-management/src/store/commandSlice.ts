import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { CommandType } from '../types/command';
import { AppDispatch } from './index';
import { addElement, updateElement, deleteElement } from './spaceSlice';

interface CommandState {
  undoStack: CommandType[];
  redoStack: CommandType[];
  canUndo: boolean;
  canRedo: boolean;
}

const initialState: CommandState = {
  undoStack: [],
  redoStack: [],
  canUndo: false,
  canRedo: false,
};

const commandSlice = createSlice({
  name: 'command',
  initialState,
  reducers: {
    executeCommand: (state, action: PayloadAction<CommandType>) => {
      state.undoStack.push(action.payload);
      state.redoStack = [];
      state.canUndo = state.undoStack.length > 0;
      state.canRedo = false;
    },
    undo: (state) => {
      const command = state.undoStack.pop();
      if (command) {
        state.redoStack.push(command);
        state.canUndo = state.undoStack.length > 0;
        state.canRedo = true;
      }
    },
    redo: (state) => {
      const command = state.redoStack.pop();
      if (command) {
        state.undoStack.push(command);
        state.canUndo = true;
        state.canRedo = state.redoStack.length > 0;
      }
    },
    clearCommands: (state) => {
      state.undoStack = [];
      state.redoStack = [];
      state.canUndo = false;
      state.canRedo = false;
    },
  },
});

// 执行命令的函数
function executeCommand(command: CommandType, dispatch: AppDispatch) {
  switch (command.type) {
    case 'ADD_ELEMENT':
      dispatch(addElement(command.element));
      break;
    case 'UPDATE_ELEMENT':
      dispatch(updateElement(command.element));
      break;
    case 'DELETE_ELEMENT':
      dispatch(deleteElement(command.element.id));
      break;
    case 'BATCH_DELETE_ELEMENTS':
      command.elements.forEach(element => {
        dispatch(deleteElement(element.id));
      });
      break;
    case 'ROTATE_ELEMENT':
      dispatch(updateElement(command.element));
      break;
  }
}

// 撤销命令的函数
function undoCommand(command: CommandType, dispatch: AppDispatch) {
  switch (command.type) {
    case 'ADD_ELEMENT':
      dispatch(deleteElement(command.element.id));
      break;
    case 'UPDATE_ELEMENT':
      dispatch(updateElement(command.previousElement));
      break;
    case 'DELETE_ELEMENT':
      dispatch(addElement(command.element));
      break;
    case 'BATCH_DELETE_ELEMENTS':
      command.elements.forEach(element => {
        dispatch(addElement(element));
      });
      break;
    case 'ROTATE_ELEMENT':
      dispatch(updateElement(command.previousElement));
      break;
  }
}

// 创建 thunk action creators
export const executeCommandThunk = (command: CommandType) => (dispatch: AppDispatch) => {
  executeCommand(command, dispatch);
  dispatch(commandSlice.actions.executeCommand(command));
};

export const undoThunk = () => (dispatch: AppDispatch, getState: () => { command: CommandState }) => {
  const command = getState().command.undoStack[getState().command.undoStack.length - 1];
  if (command) {
    undoCommand(command, dispatch);
    dispatch(commandSlice.actions.undo());
  }
};

export const redoThunk = () => (dispatch: AppDispatch, getState: () => { command: CommandState }) => {
  const command = getState().command.redoStack[getState().command.redoStack.length - 1];
  if (command) {
    executeCommand(command, dispatch);
    dispatch(commandSlice.actions.redo());
  }
};

export const { executeCommand: executeCommandAction, undo, redo, clearCommands } = commandSlice.actions;
export default commandSlice.reducer; 