/**
 * reveal.ts
 * Command handler for temporarily revealing masked values.
 */

import * as vscode from 'vscode';
import { DecorationManager } from '../decorationManager';

export const COMMAND_ID = 'screen-safe-env.temporarilyReveal';

/**
 * Creates a reveal command handler bound to a DecorationManager instance.
 * Temporarily clears all decorations for the configured duration.
 */
export function createRevealHandler(decorationManager: DecorationManager): () => void {
	return () => {
		const config = vscode.workspace.getConfiguration('screenSafeEnv');
		const revealMs = config.get<number>('revealHoldMs', 3000);

		// Temporarily clear decorations
		decorationManager.clearAllDecorations();
		
		vscode.window.showInformationMessage(
			`Screen Safe ENV: Values revealed for ${revealMs / 1000}s...`
		);

		// Re-apply after timeout
		setTimeout(() => {
			decorationManager.refreshAllDecorations();
		}, revealMs);
	};
}

/**
 * Registers the temporarily reveal command.
 */
export function registerRevealCommand(
	context: vscode.ExtensionContext,
	decorationManager: DecorationManager
): void {
	const cmd = vscode.commands.registerCommand(
		COMMAND_ID,
		createRevealHandler(decorationManager)
	);
	context.subscriptions.push(cmd);
}
