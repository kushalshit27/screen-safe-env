import * as assert from 'assert';
import * as vscode from 'vscode';
import { matchesGlobPatterns, getIncludePatterns } from '../utils/globMatcher';

// Create a mock URI for testing
function createMockUri(fsPath: string): vscode.Uri {
	return {
		fsPath,
		scheme: 'file',
		path: fsPath,
	} as vscode.Uri;
}

suite('globMatcher Test Suite', () => {
	suite('matchesGlobPatterns', () => {
		test('matches .env file with default patterns', () => {
			const uri = createMockUri('/project/.env');
			const patterns = ['**/.env*', '*.env'];
			
			assert.strictEqual(matchesGlobPatterns(uri, patterns), true);
		});

		test('matches .env.local file', () => {
			const uri = createMockUri('/project/.env.local');
			const patterns = ['**/.env*'];
			
			assert.strictEqual(matchesGlobPatterns(uri, patterns), true);
		});

		test('matches .env.development file', () => {
			const uri = createMockUri('/project/.env.development');
			const patterns = ['**/.env*'];
			
			assert.strictEqual(matchesGlobPatterns(uri, patterns), true);
		});

		test('matches nested .env file', () => {
			const uri = createMockUri('/project/config/secrets/.env');
			const patterns = ['**/.env*', '*.env'];
			
			assert.strictEqual(matchesGlobPatterns(uri, patterns), true);
		});

		test('matches filename with .env extension', () => {
			const uri = createMockUri('/project/production.env');
			const patterns = ['*.env'];
			
			assert.strictEqual(matchesGlobPatterns(uri, patterns), true);
		});

		test('does not match non-.env file', () => {
			const uri = createMockUri('/project/config.json');
			const patterns = ['**/.env*', '*.env'];
			
			assert.strictEqual(matchesGlobPatterns(uri, patterns), false);
		});

		test('does not match file in .env-prefixed directory', () => {
			// **/.env* matches files starting with .env, not files inside directories starting with .env
			const uri = createMockUri('/project/.environment/config');
			const patterns = ['**/.env*'];
			// The glob pattern matches files named .env*, not files inside .env* directories
			assert.strictEqual(matchesGlobPatterns(uri, patterns), false);
		});

		test('returns true when patterns array is empty', () => {
			const uri = createMockUri('/any/file.txt');
			const patterns: string[] = [];
			
			assert.strictEqual(matchesGlobPatterns(uri, patterns), true);
		});

		test('matches specific directory pattern', () => {
			const uri = createMockUri('/project/secrets/.env');
			const patterns = ['**/secrets/.env*'];
			
			assert.strictEqual(matchesGlobPatterns(uri, patterns), true);
		});

		test('does not match when directory pattern does not match', () => {
			const uri = createMockUri('/project/config/.env');
			const patterns = ['**/secrets/.env*'];
			
			assert.strictEqual(matchesGlobPatterns(uri, patterns), false);
		});

		test('case insensitive matching', () => {
			const uri = createMockUri('/project/.ENV');
			const patterns = ['**/.env*'];
			
			assert.strictEqual(matchesGlobPatterns(uri, patterns), true);
		});
	});

	suite('getIncludePatterns', () => {
		test('returns default patterns when not configured', async () => {
			// This test verifies the default value
			const patterns = getIncludePatterns();
			
			assert.ok(Array.isArray(patterns));
			assert.ok(patterns.length > 0);
			// Default patterns should include .env files
			assert.ok(patterns.some(p => p.includes('.env')));
		});
	});
});

suite('Configuration Tests', () => {
	test('default configuration values are set', () => {
		const config = vscode.workspace.getConfiguration('screenSafeEnv');
		
		// Test default values
		assert.strictEqual(config.get('enable'), true);
		assert.strictEqual(config.get('maskMode'), 'solid');
		assert.strictEqual(config.get('hoverReveal'), false);
		assert.strictEqual(config.get('revealHoldMs'), 3000);
	});

	test('excludeKeys has default values', () => {
		const config = vscode.workspace.getConfiguration('screenSafeEnv');
		const excludeKeys = config.get<string[]>('excludeKeys');
		
		assert.ok(Array.isArray(excludeKeys));
		assert.ok(excludeKeys!.includes('PORT'));
		assert.ok(excludeKeys!.includes('DEBUG'));
	});

	test('include has default patterns', () => {
		const config = vscode.workspace.getConfiguration('screenSafeEnv');
		const include = config.get<string[]>('include');
		
		assert.ok(Array.isArray(include));
		assert.ok(include!.some(p => p.includes('.env')));
	});

	test('maskMode enum values are valid', () => {
		const validModes = ['solid', 'lengthPreserving', 'partial'];
		const config = vscode.workspace.getConfiguration('screenSafeEnv');
		const maskMode = config.get<string>('maskMode');
		
		assert.ok(validModes.includes(maskMode!));
	});
});
