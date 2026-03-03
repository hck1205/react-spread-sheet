import type { CellCoordinate, SpreadsheetCell } from '../model';
import { getCell, setCell, setFocusedCell, setSelection, type SpreadsheetState } from '../state';
import type { SpreadsheetPlugin } from '../plugins';
import { ACTION_TYPE, COMMAND_KIND, EFFECT_TYPE } from './const';

export type SpreadsheetEffect =
  | {
      type: typeof EFFECT_TYPE.CELL_UPDATED;
      coord: CellCoordinate;
      cell: SpreadsheetCell;
    }
  | {
      type: typeof EFFECT_TYPE.SELECTION_UPDATED;
      selection: SpreadsheetState['uiState']['selection'];
    };

export type SpreadsheetCommand =
  | {
      kind: typeof COMMAND_KIND.SET_CELL;
      coord: CellCoordinate;
      nextCell: SpreadsheetCell;
      prevCell?: SpreadsheetCell;
    }
  | {
      kind: typeof COMMAND_KIND.SELECT_CELL;
      coord: CellCoordinate;
    };

export interface SpreadsheetHistory {
  undoStack: SpreadsheetCommand[];
  redoStack: SpreadsheetCommand[];
}

export interface SpreadsheetReducerState extends SpreadsheetState {
  history: SpreadsheetHistory;
}

export type SpreadsheetAction =
  | { type: typeof ACTION_TYPE.COMMAND; command: SpreadsheetCommand }
  | { type: typeof ACTION_TYPE.HISTORY_UNDO }
  | { type: typeof ACTION_TYPE.HISTORY_REDO };

export interface ReducerResult {
  state: SpreadsheetReducerState;
  effects: SpreadsheetEffect[];
}

/**
 * `set-cell` 커맨드를 생성합니다.
 *
 * @param state 현재 리듀서 상태
 * @param coord 변경할 좌표
 * @param nextCell 적용할 다음 셀 값
 * @returns undo를 위해 `prevCell`이 포함된 커맨드
 */
export const createSetCellCommand = (
  state: SpreadsheetReducerState,
  coord: CellCoordinate,
  nextCell: SpreadsheetCell
): SpreadsheetCommand => ({
  kind: COMMAND_KIND.SET_CELL,
  coord,
  nextCell,
  prevCell: getCell(state.dataState, coord)
});

/**
 * undo 처리용 역커맨드를 계산합니다.
 *
 * @param command 원본 커맨드
 * @returns 역커맨드 또는 되돌릴 수 없으면 `null`
 */
const inverseCommand = (command: SpreadsheetCommand): SpreadsheetCommand | null => {
  if (command.kind === COMMAND_KIND.SET_CELL && command.prevCell) {
    return {
      kind: COMMAND_KIND.SET_CELL,
      coord: command.coord,
      nextCell: command.prevCell
    };
  }

  return null;
};

/**
 * 커맨드 한 건을 실제 상태에 적용합니다.
 *
 * @param state 현재 상태
 * @param command 적용할 커맨드
 * @returns 상태 변경 결과와 후속 effect 목록
 */
const applyCommand = (state: SpreadsheetReducerState, command: SpreadsheetCommand): ReducerResult => {
  if (command.kind === COMMAND_KIND.SET_CELL) {
    const nextDataState = setCell(state.dataState, command.coord, command.nextCell);
    const nextState: SpreadsheetReducerState = {
      ...state,
      dataState: nextDataState
    };

    return {
      state: nextState,
      effects: [{ type: EFFECT_TYPE.CELL_UPDATED, coord: command.coord, cell: command.nextCell }]
    };
  }

  const nextSelection = {
    anchor: command.coord,
    focus: command.coord
  };
  const nextUiState = setFocusedCell(setSelection(state.uiState, nextSelection), command.coord);
  const nextState: SpreadsheetReducerState = {
    ...state,
    uiState: nextUiState
  };

  return {
    state: nextState,
    effects: [{ type: EFFECT_TYPE.SELECTION_UPDATED, selection: nextSelection }]
  };
};

/**
 * 플러그인의 `beforeCommand` 훅을 순서대로 실행합니다.
 *
 * @param plugins 등록된 플러그인 목록
 * @param state 현재 상태
 * @param command 원본 커맨드
 * @returns 변환된 커맨드 또는 취소 시 `null`
 */
const runPluginsBeforeCommand = (
  plugins: SpreadsheetPlugin[],
  state: SpreadsheetReducerState,
  command: SpreadsheetCommand
): SpreadsheetCommand | null => {
  let nextCommand: SpreadsheetCommand | null = command;

  for (const plugin of plugins) {
    if (!nextCommand || !plugin.beforeCommand) {
      continue;
    }
    nextCommand = plugin.beforeCommand({ state, command: nextCommand });
  }

  return nextCommand;
};

/**
 * 커맨드 적용 이후 플러그인 후처리를 실행합니다.
 *
 * @param plugins 등록된 플러그인 목록
 * @param state 커맨드 적용 전 상태
 * @param command 실행된 커맨드
 * @param nextState 커맨드 적용 후 상태
 * @param effects 기본 effect 목록
 * @returns 플러그인에 의해 변환된 최종 effect 목록
 */
const runPluginsAfterCommand = (
  plugins: SpreadsheetPlugin[],
  state: SpreadsheetReducerState,
  command: SpreadsheetCommand,
  nextState: SpreadsheetReducerState,
  effects: SpreadsheetEffect[]
): SpreadsheetEffect[] => {
  plugins.forEach((plugin) => {
    plugin.afterCommand?.({
      state,
      command,
      nextState,
      effects
    });
  });

  return plugins.reduce(
    (acc, plugin) => (plugin.mapEffects ? plugin.mapEffects(acc, nextState) : acc),
    effects
  );
};

/**
 * 일반 스프레드시트 상태에 undo/redo 히스토리 스택을 결합합니다.
 *
 * @param state 초기 스프레드시트 상태
 * @returns 히스토리가 포함된 리듀서 상태
 */
export const createInitialReducerState = (state: SpreadsheetState): SpreadsheetReducerState => ({
  ...state,
  history: {
    undoStack: [],
    redoStack: []
  }
});

/**
 * 스프레드시트 메인 리듀서입니다.
 *
 * 처리 범위:
 * - 일반 커맨드 실행
 * - undo/redo 히스토리 이동
 * - plugin hook 파이프라인(before/after/effect mapping)
 *
 * @param currentState 현재 리듀서 상태
 * @param action 리듀서 액션
 * @param plugins 실행에 참여할 플러그인 목록
 * @returns 다음 리듀서 상태
 */
export const spreadsheetReducer = (
  currentState: SpreadsheetReducerState,
  action: SpreadsheetAction,
  plugins: SpreadsheetPlugin[] = []
): SpreadsheetReducerState => {
  if (action.type === ACTION_TYPE.HISTORY_UNDO) {
    const latest = currentState.history.undoStack.at(-1);
    if (!latest) {
      return currentState;
    }

    const inverse = inverseCommand(latest);
    if (!inverse) {
      return currentState;
    }

    const { state: nextState } = applyCommand(currentState, inverse);
    return {
      ...nextState,
      history: {
        undoStack: currentState.history.undoStack.slice(0, -1),
        redoStack: [...currentState.history.redoStack, latest]
      }
    };
  }

  if (action.type === ACTION_TYPE.HISTORY_REDO) {
    const latest = currentState.history.redoStack.at(-1);
    if (!latest) {
      return currentState;
    }

    const { state: nextState } = applyCommand(currentState, latest);
    return {
      ...nextState,
      history: {
        undoStack: [...currentState.history.undoStack, latest],
        redoStack: currentState.history.redoStack.slice(0, -1)
      }
    };
  }

  const command = runPluginsBeforeCommand(plugins, currentState, action.command);
  if (!command) {
    return currentState;
  }

  const { state: nextState, effects } = applyCommand(currentState, command);
  runPluginsAfterCommand(plugins, currentState, command, nextState, effects);

  return {
    ...nextState,
    history: {
      undoStack: [...currentState.history.undoStack, command],
      redoStack: []
    }
  };
};
