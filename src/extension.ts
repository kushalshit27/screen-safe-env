/**
 * extension.ts
 * Main entry point for the Screen Safe ENV VS Code extension.
 */

import * as vscode from 'vscode';
import { DecorationManager } from './decorationManager';
import {
	registerToggleCommand,
	registerRevealCommand,
	registerRescanCommand,
	TOGGLE_COMMAND_ID,
} from './commands';
import { registerHoverProvider } from './hoverProvider';

// ─────────────────────────────────────────────────────────────
// Global State
// ─────────────────────────────────────────────────────────────
let statusBarItem: vscode.StatusBarItem;
let decorationManager: DecorationManager;
let debounceTimer: NodeJS.Timeout | undefined;

const DEBOUNCE_MS = 150;

/**
 * Updates the status bar item text and tooltip based on the current enable state.
 */
function updateStatusBar(): void {
	const config = vscode.workspace.getConfiguration('screenSafeEnv');
	const enabled = config.get<boolean>('enable', true);

	statusBarItem.text = enabled ? '$(eye-closed) ENV Masked' : '$(eye) ENV Visible';
	statusBarItem.tooltip = enabled
		? 'Screen Safe ENV: Values are masked. Click to reveal.'
		: 'Screen Safe ENV: Values are visible. Click to mask.';
	statusBarItem.show();
}

/**
 * Debounced decoration refresh for the active editor.
 */
function debouncedRefresh(editor: vscode.TextEditor): void {
	if (debounceTimer) {
		clearTimeout(debounceTimer);
	}
	debounceTimer = setTimeout(() => {
		decorationManager.applyDecorations(editor);
	}, DEBOUNCE_MS);
}

// ─────────────────────────────────────────────────────────────
// Activation
// ─────────────────────────────────────────────────────────────
export function activate(context: vscode.ExtensionContext): void {
	console.log('Screen Safe ENV extension is now active.');

	// Initialize DecorationManager
	decorationManager = new DecorationManager();
	context.subscriptions.push({ dispose: () => decorationManager.dispose() });

	// ─────────────────────────────────────────────────────────
	// Status Bar
	// ─────────────────────────────────────────────────────────
	statusBarItem = vscode.window.createStatusBarItem(
		vscode.StatusBarAlignment.Right,
		100
	);
	statusBarItem.command = TOGGLE_COMMAND_ID;
	context.subscriptions.push(statusBarItem);
	updateStatusBar();

	// ─────────────────────────────────────────────────────────
	// Register Commands
	// ─────────────────────────────────────────────────────────
	registerToggleCommand(context);
	registerRevealCommand(context, decorationManager);
	registerRescanCommand(context, decorationManager);

	// ─────────────────────────────────────────────────────────
	// Register Hover Provider
	// ─────────────────────────────────────────────────────────
	registerHoverProvider(context);

	// ─────────────────────────────────────────────────────────
	// Initial Decorations
	// ─────────────────────────────────────────────────────────
	if (vscode.window.activeTextEditor) {
		decorationManager.applyDecorations(vscode.window.activeTextEditor);
	}

	// ─────────────────────────────────────────────────────────
	// Event: Active Editor Changed
	// ─────────────────────────────────────────────────────────
	context.subscriptions.push(
		vscode.window.onDidChangeActiveTextEditor((editor) => {
			if (editor) {
				decorationManager.applyDecorations(editor);
			}
		})
	);

	// ─────────────────────────────────────────────────────────
	// Event: Document Changed (debounced)
	// ─────────────────────────────────────────────────────────
	context.subscriptions.push(
		vscode.workspace.onDidChangeTextDocument((event) => {
			const editor = vscode.window.activeTextEditor;
			if (editor && event.document === editor.document) {
				debouncedRefresh(editor);
			}
		})
	);

	// ─────────────────────────────────────────────────────────
	// Event: Configuration Changed
	// ─────────────────────────────────────────────────────────
	context.subscriptions.push(
		vscode.workspace.onDidChangeConfiguration((e) => {
			if (e.affectsConfiguration('screenSafeEnv')) {
				updateStatusBar();
				decorationManager.onConfigurationChanged();
			}
		})
	);
}

// ─────────────────────────────────────────────────────────────
// Deactivation
// ─────────────────────────────────────────────────────────────
export function deactivate(): void {
	if (debounceTimer) {
		clearTimeout(debounceTimer);
	}
	if (decorationManager) {
		decorationManager.dispose();
	}
	console.log('Screen Safe ENV extension is now deactivated.');
}
