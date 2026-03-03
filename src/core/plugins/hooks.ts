import type { SpreadsheetCommand, SpreadsheetEffect } from '../commands';
import type { SpreadsheetState } from '../state';

export interface PluginCommandContext {
  state: SpreadsheetState;
  command: SpreadsheetCommand;
}

export interface PluginAfterCommandContext extends PluginCommandContext {
  nextState: SpreadsheetState;
  effects: SpreadsheetEffect[];
}

export interface SpreadsheetPlugin {
  name: string;
  beforeCommand?: (context: PluginCommandContext) => SpreadsheetCommand | null;
  afterCommand?: (context: PluginAfterCommandContext) => void;
  mapEffects?: (effects: SpreadsheetEffect[], state: SpreadsheetState) => SpreadsheetEffect[];
}
