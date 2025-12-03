import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Extension Test Suite', () => {
	vscode.window.showInformationMessage('Start all tests.');

	test('Extension should be present', () => {
		const ext = vscode.extensions.getExtension('kushalshit27.screen-safe-env');
		assert.ok(ext, 'Extension should be registered');
	});

	test('Extension should activate on dotenv file', async () => {
		// Create a temporary .env document
		const doc = await vscode.workspace.openTextDocument({
			language: 'dotenv',
			content: 'API_KEY=secret123\nPORT=3000',
		});
		await vscode.window.showTextDocument(doc);

		// Give extension time to activate
		await new Promise((resolve) => setTimeout(resolve, 500));

		const ext = vscode.extensions.getExtension('kushalshit27.screen-safe-env');
		// Extension should be active after opening a dotenv file
		assert.ok(ext?.isActive, 'Extension should be active after opening .env file');
	});

	test('Toggle command should be registered', async () => {
		const commands = await vscode.commands.getCommands(true);
		assert.ok(
			commands.includes('screen-safe-env.toggleHideShow'),
			'toggleHideShow command should be registered'
		);
	});

	test('Temporarily reveal command should be registered', async () => {
		const commands = await vscode.commands.getCommands(true);
		assert.ok(
			commands.includes('screen-safe-env.temporarilyReveal'),
			'temporarilyReveal command should be registered'
		);
	});

	test('Force rescan command should be registered', async () => {
		const commands = await vscode.commands.getCommands(true);
		assert.ok(
			commands.includes('screen-safe-env.forceRescan'),
			'forceRescan command should be registered'
		);
	});
});
