/**
 * rescan.ts
 * Command handler for force rescanning the current .env file.
 */

import * as vscode from 'vscode';
import { DecorationManager } from '../decorationManager';
import { shouldProcessDocument } from '../utils/globMatcher';

export const COMMAND_ID = 'screen-safe-env.forceRescan';

/**
 * Creates a rescan command handler bound to a DecorationManager instance.
 * Forces re-parsing and re-decorating the active .env file.
 */
export function createRescanHandler(decorationManager: DecorationManager): () => void {
	return () => {
		const editor = vscode.window.activeTextEditor;
		
		if (editor && shouldProcessDocument(editor.document)) {
			decorationManager.applyDecorations(editor);
			vscode.window.showInformationMessage(
				'Screen Safe ENV: File rescanned.'
			);
		} else {
			vscode.window.showWarningMessage(
				'Screen Safe ENV: No .env file is currently active.'
			);
		}
	};
}

/**
 * Registers the force rescan command.
 */
export function registerRescanCommand(
	context: vscode.ExtensionContext,
	decorationManager: DecorationManager
): void {
	const cmd = vscode.commands.registerCommand(
		COMMAND_ID,
		createRescanHandler(decorationManager)
	);
	context.subscriptions.push(cmd);
}
