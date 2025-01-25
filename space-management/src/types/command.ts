import { SpaceElement } from './space';

export interface AddElementCommand {
  type: 'ADD_ELEMENT';
  element: SpaceElement;
}

export interface UpdateElementCommand {
  type: 'UPDATE_ELEMENT';
  element: SpaceElement;
  previousElement: SpaceElement;
}

export interface DeleteElementCommand {
  type: 'DELETE_ELEMENT';
  element: SpaceElement;
}

export interface BatchDeleteElementsCommand {
  type: 'BATCH_DELETE_ELEMENTS';
  elements: SpaceElement[];
}

export interface RotateElementCommand {
  type: 'ROTATE_ELEMENT';
  element: SpaceElement;
  previousElement: SpaceElement;
  rotation: number;
}

export type CommandType = 
  | AddElementCommand
  | UpdateElementCommand
  | DeleteElementCommand
  | BatchDeleteElementsCommand
  | RotateElementCommand; 