import * as assert from 'assert';
import { parseYamlDocument, isYamlDocument } from '../parsers/yamlParser';

// Mock TextDocument for testing
function createMockDocument(
	content: string,
	languageId: string = 'yaml',
	fileName: string = '/project/config.yaml'
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

suite('yamlParser Test Suite', () => {
	suite('parseYamlDocument', () => {
		test('parses simple key-value pairs', () => {
			const doc = createMockDocument('api_key: secret123\ndb_host: localhost');
			const entries = parseYamlDocument(doc as any);

			assert.strictEqual(entries.length, 2);
			assert.strictEqual(entries[0].key, 'api_key');
			assert.strictEqual(entries[0].value, 'secret123');
			assert.strictEqual(entries[0].line, 0);
			assert.strictEqual(entries[1].key, 'db_host');
			assert.strictEqual(entries[1].value, 'localhost');
			assert.strictEqual(entries[1].line, 1);
		});

		test('handles double-quoted values', () => {
			const doc = createMockDocument('message: "Hello World"');
			const entries = parseYamlDocument(doc as any);

			assert.strictEqual(entries.length, 1);
			assert.strictEqual(entries[0].key, 'message');
			assert.strictEqual(entries[0].value, 'Hello World');
		});

		test('handles single-quoted values', () => {
			const doc = createMockDocument("password: 'p@ss=word'");
			const entries = parseYamlDocument(doc as any);

			assert.strictEqual(entries.length, 1);
			assert.strictEqual(entries[0].key, 'password');
			assert.strictEqual(entries[0].value, 'p@ss=word');
		});

		test('skips comment lines', () => {
			const doc = createMockDocument('# This is a comment\napi_key: secret\n# Another comment');
			const entries = parseYamlDocument(doc as any);

			assert.strictEqual(entries.length, 1);
			assert.strictEqual(entries[0].key, 'api_key');
		});

		test('skips empty lines', () => {
			const doc = createMockDocument('api_key: secret\n\ndb_host: localhost');
			const entries = parseYamlDocument(doc as any);

			assert.strictEqual(entries.length, 2);
		});

		test('handles inline comments', () => {
			const doc = createMockDocument('api_key: secret123 # this is the API key');
			const entries = parseYamlDocument(doc as any);

			assert.strictEqual(entries.length, 1);
			assert.strictEqual(entries[0].key, 'api_key');
			assert.strictEqual(entries[0].value, 'secret123');
		});

		test('preserves hash in quoted values', () => {
			const doc = createMockDocument('password: "p@ss#word"');
			const entries = parseYamlDocument(doc as any);

			assert.strictEqual(entries.length, 1);
			assert.strictEqual(entries[0].value, 'p@ss#word');
		});

		test('handles nested keys', () => {
			const doc = createMockDocument('database:\n  host: localhost\n  password: secret');
			const entries = parseYamlDocument(doc as any);

			// Should capture the nested values
			assert.strictEqual(entries.length, 2);
			assert.strictEqual(entries[0].key, 'host');
			assert.strictEqual(entries[0].value, 'localhost');
			assert.strictEqual(entries[1].key, 'password');
			assert.strictEqual(entries[1].value, 'secret');
		});

		test('skips multiline block indicators', () => {
			const doc = createMockDocument('description: |\n  multi\n  line\napi_key: secret');
			const entries = parseYamlDocument(doc as any);

			// Should only capture api_key, not description with block indicator
			const apiKeyEntry = entries.find(e => e.key === 'api_key');
			assert.ok(apiKeyEntry);
			assert.strictEqual(apiKeyEntry.value, 'secret');
		});

		test('handles values with colons', () => {
			const doc = createMockDocument('url: "https://example.com:8080"');
			const entries = parseYamlDocument(doc as any);

			assert.strictEqual(entries.length, 1);
			assert.strictEqual(entries[0].value, 'https://example.com:8080');
		});

		test('handles keys with dots', () => {
			const doc = createMockDocument('spring.datasource.url: jdbc:mysql://localhost');
			const entries = parseYamlDocument(doc as any);

			assert.strictEqual(entries.length, 1);
			assert.strictEqual(entries[0].key, 'spring.datasource.url');
		});

		test('handles keys with hyphens', () => {
			const doc = createMockDocument('api-key: secret123');
			const entries = parseYamlDocument(doc as any);

			assert.strictEqual(entries.length, 1);
			assert.strictEqual(entries[0].key, 'api-key');
		});

		test('calculates correct value positions', () => {
			const doc = createMockDocument('api_key: secret');
			const entries = parseYamlDocument(doc as any);

			assert.strictEqual(entries.length, 1);
			// Line: 'api_key: secret'
			// valueStart should be at position 9 (after 'api_key: ')
			assert.strictEqual(entries[0].valueStart, 9);
			assert.strictEqual(entries[0].valueEnd, 15);
		});

		test('calculates correct positions for quoted values', () => {
			const doc = createMockDocument('api_key: "secret"');
			const entries = parseYamlDocument(doc as any);

			assert.strictEqual(entries.length, 1);
			// Value should not include quotes
			assert.strictEqual(entries[0].value, 'secret');
		});

		test('skips list items without keys', () => {
			const doc = createMockDocument('items:\n  - value1\n  - value2\napi_key: secret');
			const entries = parseYamlDocument(doc as any);

			// Should only capture api_key
			const apiKeyEntry = entries.find(e => e.key === 'api_key');
			assert.ok(apiKeyEntry);
			assert.strictEqual(apiKeyEntry.value, 'secret');
		});

		test('skips parent keys with empty values', () => {
			const doc = createMockDocument('database:\n  host: localhost');
			const entries = parseYamlDocument(doc as any);

			// Should not include 'database' since it has no direct value
			const databaseEntry = entries.find(e => e.key === 'database');
			assert.strictEqual(databaseEntry, undefined);
			assert.strictEqual(entries.length, 1);
			assert.strictEqual(entries[0].key, 'host');
		});
	});

	suite('isYamlDocument', () => {
		test('returns true for yaml language ID', () => {
			const doc = createMockDocument('key: value', 'yaml', '/project/config.yaml');
			assert.strictEqual(isYamlDocument(doc as any), true);
		});

		test('returns true for yml language ID', () => {
			const doc = createMockDocument('key: value', 'yml', '/project/config.yml');
			assert.strictEqual(isYamlDocument(doc as any), true);
		});

		test('returns true for .yaml file extension', () => {
			const doc = createMockDocument('key: value', 'plaintext', '/project/config.yaml');
			assert.strictEqual(isYamlDocument(doc as any), true);
		});

		test('returns true for .yml file extension', () => {
			const doc = createMockDocument('key: value', 'plaintext', '/project/config.yml');
			assert.strictEqual(isYamlDocument(doc as any), true);
		});

		test('returns false for non-yaml files', () => {
			const doc = createMockDocument('key=value', 'dotenv', '/project/.env');
			assert.strictEqual(isYamlDocument(doc as any), false);
		});

		test('returns false for json files', () => {
			const doc = createMockDocument('{}', 'json', '/project/config.json');
			assert.strictEqual(isYamlDocument(doc as any), false);
		});
	});
});
