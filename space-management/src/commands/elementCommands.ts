import { SpaceElement } from '../types/space';
import { AddElementCommand, UpdateElementCommand, DeleteElementCommand, BatchDeleteElementsCommand } from '../types/command';

export function createAddElementCommand(element: SpaceElement): AddElementCommand {
  return {
    type: 'ADD_ELEMENT',
    element
  };
}

export function createUpdateElementCommand(element: SpaceElement, previousElement: SpaceElement): UpdateElementCommand {
  return {
    type: 'UPDATE_ELEMENT',
    element,
    previousElement
  };
}

export function createDeleteElementCommand(element: SpaceElement): DeleteElementCommand {
  return {
    type: 'DELETE_ELEMENT',
    element
  };
}

export function createBatchDeleteElementsCommand(elements: SpaceElement[]): BatchDeleteElementsCommand {
  return {
    type: 'BATCH_DELETE_ELEMENTS',
    elements
  };
} 