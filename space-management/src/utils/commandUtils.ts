import { executeCommandThunk } from '../store/commandSlice';
import { CommandType } from '../types/command';
import { Dispatch } from 'redux';

export function executeAndRecord(command: CommandType, dispatch: Dispatch) {
  dispatch(executeCommandThunk(command));
} 