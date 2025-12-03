import * as assert from 'assert';
import * as vscode from 'vscode';
import { EnvHoverProvider } from '../hoverProvider';

suite('HoverProvider Test Suite', () => {
	let provider: EnvHoverProvider;

	setup(() => {
		provider = new EnvHoverProvider();
	});

	suite('Configuration Checks', () => {
		test('hover provider exists', () => {
			assert.ok(provider, 'HoverProvider should be instantiated');
		});

		test('provideHover method exists', () => {
			assert.ok(
				typeof provider.provideHover === 'function',
				'provideHover should be a function'
			);
		});
	});

	suite('Hover Behavior', () => {
		test('returns null when hoverReveal is disabled (default)', async () => {
			// Create a test document
			const doc = await vscode.workspace.openTextDocument({
				language: 'dotenv',
				content: 'API_KEY=secret123',
			});

			// Ensure hoverReveal is disabled (default)
			const config = vscode.workspace.getConfiguration('screenSafeEnv');
			await config.update('hoverReveal', false, vscode.ConfigurationTarget.Global);

			// Position on the value
			const position = new vscode.Position(0, 10); // On 'secret123'
			const token = new vscode.CancellationTokenSource().token;

			const result = provider.provideHover(doc, position, token);
			assert.strictEqual(result, null, 'Should return null when hoverReveal is disabled');

			// Cleanup
			await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
		});

		test('returns null when masking is disabled', async () => {
			const doc = await vscode.workspace.openTextDocument({
				language: 'dotenv',
				content: 'API_KEY=secret123',
			});

			const config = vscode.workspace.getConfiguration('screenSafeEnv');
			// Enable hover but disable masking
			await config.update('hoverReveal', true, vscode.ConfigurationTarget.Global);
			await config.update('enable', false, vscode.ConfigurationTarget.Global);

			const position = new vscode.Position(0, 10);
			const token = new vscode.CancellationTokenSource().token;

			const result = provider.provideHover(doc, position, token);
			assert.strictEqual(result, null, 'Should return null when masking is disabled');

			// Reset config
			await config.update('enable', true, vscode.ConfigurationTarget.Global);
			await config.update('hoverReveal', false, vscode.ConfigurationTarget.Global);
			await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
		});

		test('returns hover when both masking and hoverReveal are enabled', async () => {
			const doc = await vscode.workspace.openTextDocument({
				language: 'dotenv',
				content: 'API_KEY=secret123',
			});

			const config = vscode.workspace.getConfiguration('screenSafeEnv');
			await config.update('hoverReveal', true, vscode.ConfigurationTarget.Global);
			await config.update('enable', true, vscode.ConfigurationTarget.Global);

			// Position on the value (API_KEY= is 8 chars, so position 8-16 is the value)
			const position = new vscode.Position(0, 10);
			const token = new vscode.CancellationTokenSource().token;

			const result = provider.provideHover(doc, position, token);
			assert.ok(result, 'Should return hover when both settings are enabled');

			// Reset config
			await config.update('hoverReveal', false, vscode.ConfigurationTarget.Global);
			await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
		});

		test('returns null for position outside value range', async () => {
			const doc = await vscode.workspace.openTextDocument({
				language: 'dotenv',
				content: 'API_KEY=secret123',
			});

			const config = vscode.workspace.getConfiguration('screenSafeEnv');
			await config.update('hoverReveal', true, vscode.ConfigurationTarget.Global);
			await config.update('enable', true, vscode.ConfigurationTarget.Global);

			// Position on the key, not the value
			const position = new vscode.Position(0, 2); // On 'API_KEY'
			const token = new vscode.CancellationTokenSource().token;

			const result = provider.provideHover(doc, position, token);
			assert.strictEqual(result, null, 'Should return null for position on key');

			// Reset config
			await config.update('hoverReveal', false, vscode.ConfigurationTarget.Global);
			await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
		});

		test('returns null for excluded keys', async () => {
			const doc = await vscode.workspace.openTextDocument({
				language: 'dotenv',
				content: 'PORT=3000',
			});

			const config = vscode.workspace.getConfiguration('screenSafeEnv');
			await config.update('hoverReveal', true, vscode.ConfigurationTarget.Global);
			await config.update('enable', true, vscode.ConfigurationTarget.Global);

			// PORT is in default excludeKeys
			const position = new vscode.Position(0, 6); // On '3000'
			const token = new vscode.CancellationTokenSource().token;

			const result = provider.provideHover(doc, position, token);
			assert.strictEqual(result, null, 'Should return null for excluded keys');

			// Reset config
			await config.update('hoverReveal', false, vscode.ConfigurationTarget.Global);
			await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
		});

		test('returns null for empty values', async () => {
			const doc = await vscode.workspace.openTextDocument({
				language: 'dotenv',
				content: 'EMPTY_VAR=',
			});

			const config = vscode.workspace.getConfiguration('screenSafeEnv');
			await config.update('hoverReveal', true, vscode.ConfigurationTarget.Global);
			await config.update('enable', true, vscode.ConfigurationTarget.Global);

			const position = new vscode.Position(0, 10);
			const token = new vscode.CancellationTokenSource().token;

			const result = provider.provideHover(doc, position, token);
			assert.strictEqual(result, null, 'Should return null for empty values');

			// Reset config
			await config.update('hoverReveal', false, vscode.ConfigurationTarget.Global);
			await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
		});
	});

	suite('Hover Content', () => {
		test('hover contains the actual value', async () => {
			const doc = await vscode.workspace.openTextDocument({
				language: 'dotenv',
				content: 'SECRET=my_secret_value',
			});

			const config = vscode.workspace.getConfiguration('screenSafeEnv');
			await config.update('hoverReveal', true, vscode.ConfigurationTarget.Global);
			await config.update('enable', true, vscode.ConfigurationTarget.Global);

			const position = new vscode.Position(0, 10);
			const token = new vscode.CancellationTokenSource().token;

			const result = provider.provideHover(doc, position, token);
			assert.ok(result, 'Should return hover');
			
			if (result) {
				const hover = result as vscode.Hover;
				const contents = hover.contents;
				assert.ok(contents.length > 0, 'Hover should have contents');
				
				// Check that content includes the value
				const markdown = contents[0] as vscode.MarkdownString;
				assert.ok(
					markdown.value.includes('my_secret_value'),
					'Hover should contain the actual value'
				);
			}

			// Reset config
			await config.update('hoverReveal', false, vscode.ConfigurationTarget.Global);
			await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
		});

		test('hover contains privacy warning', async () => {
			const doc = await vscode.workspace.openTextDocument({
				language: 'dotenv',
				content: 'API_KEY=secret123',
			});

			const config = vscode.workspace.getConfiguration('screenSafeEnv');
			await config.update('hoverReveal', true, vscode.ConfigurationTarget.Global);
			await config.update('enable', true, vscode.ConfigurationTarget.Global);

			const position = new vscode.Position(0, 10);
			const token = new vscode.CancellationTokenSource().token;

			const result = provider.provideHover(doc, position, token);
			
			if (result) {
				const hover = result as vscode.Hover;
				const markdown = hover.contents[0] as vscode.MarkdownString;
				assert.ok(
					markdown.value.includes('screen sharing') || 
					markdown.value.includes('Screen Safe ENV'),
					'Hover should contain privacy warning'
				);
			}

			// Reset config
			await config.update('hoverReveal', false, vscode.ConfigurationTarget.Global);
			await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
		});
	});
});
