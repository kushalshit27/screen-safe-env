import * as assert from 'assert';
import { parseJsonDocument, isJsonDocument } from '../parsers/jsonParser';

// Mock TextDocument for testing
function createMockDocument(
	content: string,
	languageId: string = 'json',
	fileName: string = '/project/config.json'
): {
	getText: () => string;
	lineCount: number;
	lineAt: (line: number) => { text: string };
	languageId: string;
	fileName: string;
} {
	const lines = content.split('\n');
	return {
		getText: () => content,
		lineCount: lines.length,
		lineAt: (line: number) => ({ text: lines[line] || '' }),
		languageId,
		fileName,
	};
}

suite('jsonParser Test Suite', () => {
	suite('parseJsonDocument', () => {
		test('parses simple key-value pairs', () => {
			const doc = createMockDocument('{\n  "api_key": "secret123",\n  "db_host": "localhost"\n}');
			const entries = parseJsonDocument(doc as any);

			assert.strictEqual(entries.length, 2);
			assert.strictEqual(entries[0].key, 'api_key');
			assert.strictEqual(entries[0].value, 'secret123');
			assert.strictEqual(entries[0].line, 1);
			assert.strictEqual(entries[1].key, 'db_host');
			assert.strictEqual(entries[1].value, 'localhost');
			assert.strictEqual(entries[1].line, 2);
		});

		test('handles single-quoted values', () => {
			const doc = createMockDocument("{\n  'password': 'p@ssword'\n}");
			const entries = parseJsonDocument(doc as any);

			assert.strictEqual(entries.length, 1);
			assert.strictEqual(entries[0].key, 'password');
			assert.strictEqual(entries[0].value, 'p@ssword');
		});

		test('handles mixed quotes', () => {
			const doc = createMockDocument('{\n  "key": \'value\'\n}');
			const entries = parseJsonDocument(doc as any);

			assert.strictEqual(entries.length, 1);
			assert.strictEqual(entries[0].key, 'key');
			assert.strictEqual(entries[0].value, 'value');
		});

		test('handles empty values', () => {
			const doc = createMockDocument('{\n  "empty": ""\n}');
			const entries = parseJsonDocument(doc as any);

			assert.strictEqual(entries.length, 1);
			assert.strictEqual(entries[0].key, 'empty');
			assert.strictEqual(entries[0].value, '');
		});

		test('handles multiple values on same line', () => {
			const doc = createMockDocument('{ "key1": "value1", "key2": "value2" }');
			const entries = parseJsonDocument(doc as any);

			assert.strictEqual(entries.length, 2);
			assert.strictEqual(entries[0].key, 'key1');
			assert.strictEqual(entries[0].value, 'value1');
			assert.strictEqual(entries[1].key, 'key2');
			assert.strictEqual(entries[1].value, 'value2');
		});

		test('calculates correct value positions', () => {
			const doc = createMockDocument('{\n  "api_key": "secret"\n}');
			const entries = parseJsonDocument(doc as any);

			assert.strictEqual(entries.length, 1);
			// Line: '  "api_key": "secret"'
			// Position of 'secret' starts after the opening quote
			assert.strictEqual(entries[0].valueStart, 14);
			assert.strictEqual(entries[0].valueEnd, 20);
		});

		test('ignores numeric values', () => {
			const doc = createMockDocument('{\n  "port": 3000,\n  "api_key": "secret"\n}');
			const entries = parseJsonDocument(doc as any);

			// Only string values are captured
			assert.strictEqual(entries.length, 1);
			assert.strictEqual(entries[0].key, 'api_key');
		});

		test('ignores boolean values', () => {
			const doc = createMockDocument('{\n  "enabled": true,\n  "api_key": "secret"\n}');
			const entries = parseJsonDocument(doc as any);

			assert.strictEqual(entries.length, 1);
			assert.strictEqual(entries[0].key, 'api_key');
		});

		test('handles nested objects (flat extraction)', () => {
			const doc = createMockDocument('{\n  "database": {\n    "host": "localhost",\n    "password": "secret"\n  }\n}');
			const entries = parseJsonDocument(doc as any);

			assert.strictEqual(entries.length, 2);
			assert.strictEqual(entries[0].key, 'host');
			assert.strictEqual(entries[0].value, 'localhost');
			assert.strictEqual(entries[1].key, 'password');
			assert.strictEqual(entries[1].value, 'secret');
		});

		test('handles values with special characters', () => {
			const doc = createMockDocument('{\n  "url": "https://example.com?foo=bar"\n}');
			const entries = parseJsonDocument(doc as any);

			assert.strictEqual(entries.length, 1);
			assert.strictEqual(entries[0].key, 'url');
			assert.strictEqual(entries[0].value, 'https://example.com?foo=bar');
		});

		test('handles values with spaces', () => {
			const doc = createMockDocument('{\n  "message": "Hello World"\n}');
			const entries = parseJsonDocument(doc as any);

			assert.strictEqual(entries.length, 1);
			assert.strictEqual(entries[0].value, 'Hello World');
		});
	});

	suite('isJsonDocument', () => {
		test('returns true for json language ID', () => {
			const doc = createMockDocument('{}', 'json', '/project/config.json');
			assert.strictEqual(isJsonDocument(doc as any), true);
		});

		test('returns true for jsonc language ID', () => {
			const doc = createMockDocument('{}', 'jsonc', '/project/config.jsonc');
			assert.strictEqual(isJsonDocument(doc as any), true);
		});

		test('returns true for .json file extension', () => {
			const doc = createMockDocument('{}', 'plaintext', '/project/config.json');
			assert.strictEqual(isJsonDocument(doc as any), true);
		});

		test('returns false for non-json files', () => {
			const doc = createMockDocument('key=value', 'dotenv', '/project/.env');
			assert.strictEqual(isJsonDocument(doc as any), false);
		});

		test('returns false for yaml files', () => {
			const doc = createMockDocument('key: value', 'yaml', '/project/config.yaml');
			assert.strictEqual(isJsonDocument(doc as any), false);
		});
	});
});
