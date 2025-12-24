import * as assert from 'assert';
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

suite('Extension Test Suite', () => {
	vscode.window.showInformationMessage('Start all tests.');

	test('Extension should be present', () => {
		const ext = vscode.extensions.getExtension('kushals.screen-safe-env');
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

		const ext = vscode.extensions.getExtension('kushals.screen-safe-env');
		// Extension should be active after opening a dotenv file
		assert.ok(ext?.isActive, 'Extension should be active after opening .env file');
	});

	test('Extension should activate on JSON config when included', async () => {
		const config = vscode.workspace.getConfiguration('screenSafeEnv');
		const previousInclude = config.get<string[]>('include');
		const target = vscode.workspace.workspaceFolders
			? vscode.ConfigurationTarget.Workspace
			: vscode.ConfigurationTarget.Global;

		// Ensure JSON files are included for processing
		await config.update('include', ['**/*.json', '**/.env*', '*.env'], target);

		const tmpDir = path.join(os.tmpdir(), 'screen-safe-env-tests');
		await fs.promises.mkdir(tmpDir, { recursive: true });
		const jsonPath = path.join(tmpDir, 'config.test.json');
		await fs.promises.writeFile(jsonPath, '{"apiKey":"secret-value"}');

		try {
			const doc = await vscode.workspace.openTextDocument(vscode.Uri.file(jsonPath));
			await vscode.window.showTextDocument(doc);

			// Give extension time to activate
			await new Promise((resolve) => setTimeout(resolve, 500));

			const ext = vscode.extensions.getExtension('kushals.screen-safe-env');
			assert.ok(ext?.isActive, 'Extension should be active after opening included JSON file');
		} finally {
			await config.update('include', previousInclude, target);
			try {
				await fs.promises.unlink(jsonPath);
			} catch (err) {
				if ((err as NodeJS.ErrnoException).code !== 'ENOENT') {
					throw err;
				}
			}
		}
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
