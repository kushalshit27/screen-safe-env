import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Commands Test Suite', () => {
	// Ensure extension is activated
	suiteSetup(async () => {
		const ext = vscode.extensions.getExtension('kushals.screen-safe-env');
		if (ext && !ext.isActive) {
			await ext.activate();
		}
	});

	suite('Command Registration', () => {
		test('toggleHideShow command is registered', async () => {
			const commands = await vscode.commands.getCommands(true);
			assert.ok(
				commands.includes('screen-safe-env.toggleHideShow'),
				'toggleHideShow command should be registered'
			);
		});

		test('temporarilyReveal command is registered', async () => {
			const commands = await vscode.commands.getCommands(true);
			assert.ok(
				commands.includes('screen-safe-env.temporarilyReveal'),
				'temporarilyReveal command should be registered'
			);
		});

		test('forceRescan command is registered', async () => {
			const commands = await vscode.commands.getCommands(true);
			assert.ok(
				commands.includes('screen-safe-env.forceRescan'),
				'forceRescan command should be registered'
			);
		});
	});

	suite('Toggle Command', () => {
		test('toggle command changes enable setting', async () => {
			const config = vscode.workspace.getConfiguration('screenSafeEnv');
			const initialState = config.get<boolean>('enable', true);

			// Execute toggle command
			await vscode.commands.executeCommand('screen-safe-env.toggleHideShow');

			// Wait for configuration to update
			await new Promise((resolve) => setTimeout(resolve, 100));

			const newConfig = vscode.workspace.getConfiguration('screenSafeEnv');
			const newState = newConfig.get<boolean>('enable');

			assert.strictEqual(
				newState,
				!initialState,
				'Enable state should be toggled'
			);

			// Reset to original state
			await config.update('enable', initialState, vscode.ConfigurationTarget.Global);
		});
	});

	suite('Temporarily Reveal Command', () => {
		test('temporarilyReveal command executes without error', async () => {
			// This test just verifies the command doesn't throw
			try {
				await vscode.commands.executeCommand('screen-safe-env.temporarilyReveal');
				assert.ok(true, 'Command executed successfully');
			} catch (error) {
				assert.fail(`Command threw an error: ${error}`);
			}
		});
	});

	suite('Force Rescan Command', () => {
		test('forceRescan command executes without error when no .env file', async () => {
			// Command should show warning when no .env file is active
			try {
				await vscode.commands.executeCommand('screen-safe-env.forceRescan');
				assert.ok(true, 'Command executed successfully');
			} catch (error) {
				assert.fail(`Command threw an error: ${error}`);
			}
		});

		test('forceRescan command works with .env file', async () => {
			// Create a temporary .env file content
			const doc = await vscode.workspace.openTextDocument({
				language: 'dotenv',
				content: 'API_KEY=secret123\nDB_HOST=localhost',
			});
			
			await vscode.window.showTextDocument(doc);

			try {
				await vscode.commands.executeCommand('screen-safe-env.forceRescan');
				assert.ok(true, 'Command executed successfully with .env file');
			} catch (error) {
				assert.fail(`Command threw an error: ${error}`);
			}

			// Close the document
			await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
		});
	});

	suite('Keybindings', () => {
		test('keybindings are defined in package.json', () => {
			const ext = vscode.extensions.getExtension('kushals.screen-safe-env');
			assert.ok(ext, 'Extension should exist');

			const packageJson = ext?.packageJSON;
			assert.ok(packageJson?.contributes?.keybindings, 'Keybindings should be defined');

			const keybindings = packageJson.contributes.keybindings;
			assert.ok(
				keybindings.some((kb: { command: string }) => kb.command === 'screen-safe-env.toggleHideShow'),
				'Toggle command should have keybinding'
			);
			assert.ok(
				keybindings.some((kb: { command: string }) => kb.command === 'screen-safe-env.temporarilyReveal'),
				'Reveal command should have keybinding'
			);
		});
	});
});
