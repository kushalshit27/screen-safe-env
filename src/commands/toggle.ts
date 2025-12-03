/**
 * toggle.ts
 * Command handler for toggling mask visibility on/off.
 */

import * as vscode from 'vscode';

export const COMMAND_ID = 'screen-safe-env.toggleHideShow';

/**
 * Toggles the screenSafeEnv.enable setting.
 * When enabled, values are masked. When disabled, values are visible.
 */
export async function toggleHideShow(): Promise<void> {
	const config = vscode.workspace.getConfiguration('screenSafeEnv');
	const current = config.get<boolean>('enable', true);
	
	await config.update('enable', !current, vscode.ConfigurationTarget.Global);
	
	vscode.window.showInformationMessage(
		`Screen Safe ENV: Masking ${!current ? 'enabled' : 'disabled'}.`
	);
}

/**
 * Registers the toggle command.
 */
export function registerToggleCommand(context: vscode.ExtensionContext): void {
	const cmd = vscode.commands.registerCommand(COMMAND_ID, toggleHideShow);
	context.subscriptions.push(cmd);
}
