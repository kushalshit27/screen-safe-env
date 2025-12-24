import * as assert from 'assert';
import {
	parseConfigDocument,
	detectFileType,
	isSupportedConfigFile,
	ConfigFileType,
} from '../parsers';

// Mock TextDocument for testing
function createMockDocument(
	content: string,
	languageId: string,
	fileName: string
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

suite('Unified Parsers Test Suite', () => {
	suite('detectFileType', () => {
		test('detects dotenv files by language ID', () => {
			const doc = createMockDocument('API_KEY=secret', 'dotenv', '/project/.env');
			assert.strictEqual(detectFileType(doc as any), 'env');
		});

		test('detects JSON files by language ID', () => {
			const doc = createMockDocument('{}', 'json', '/project/config.json');
			assert.strictEqual(detectFileType(doc as any), 'json');
		});

		test('detects JSONC files by language ID', () => {
			const doc = createMockDocument('{}', 'jsonc', '/project/settings.json');
			assert.strictEqual(detectFileType(doc as any), 'json');
		});

		test('detects YAML files by language ID', () => {
			const doc = createMockDocument('key: value', 'yaml', '/project/config.yaml');
			assert.strictEqual(detectFileType(doc as any), 'yaml');
		});

		test('detects YML files by language ID', () => {
			const doc = createMockDocument('key: value', 'yml', '/project/config.yml');
			assert.strictEqual(detectFileType(doc as any), 'yaml');
		});

		test('detects .env files by extension', () => {
			const doc = createMockDocument('API_KEY=secret', 'plaintext', '/project/.env');
			assert.strictEqual(detectFileType(doc as any), 'env');
		});

		test('detects .env.local files by extension', () => {
			const doc = createMockDocument('API_KEY=secret', 'plaintext', '/project/.env.local');
			assert.strictEqual(detectFileType(doc as any), 'env');
		});

		test('detects .json files by extension', () => {
			const doc = createMockDocument('{}', 'plaintext', '/project/config.json');
			assert.strictEqual(detectFileType(doc as any), 'json');
		});

		test('detects .yaml files by extension', () => {
			const doc = createMockDocument('key: value', 'plaintext', '/project/config.yaml');
			assert.strictEqual(detectFileType(doc as any), 'yaml');
		});

		test('detects .yml files by extension', () => {
			const doc = createMockDocument('key: value', 'plaintext', '/project/config.yml');
			assert.strictEqual(detectFileType(doc as any), 'yaml');
		});

		test('returns unknown for unsupported files', () => {
			const doc = createMockDocument('content', 'plaintext', '/project/readme.txt');
			assert.strictEqual(detectFileType(doc as any), 'unknown');
		});
	});

	suite('parseConfigDocument', () => {
		test('parses .env files', () => {
			const doc = createMockDocument('API_KEY=secret123', 'dotenv', '/project/.env');
			const entries = parseConfigDocument(doc as any);

			assert.strictEqual(entries.length, 1);
			assert.strictEqual(entries[0].key, 'API_KEY');
			assert.strictEqual(entries[0].value, 'secret123');
		});

		test('parses JSON files with quotes included', () => {
			const doc = createMockDocument('{\n  "api_key": "secret123"\n}', 'json', '/project/config.json');
			const entries = parseConfigDocument(doc as any);

			assert.strictEqual(entries.length, 1);
			assert.strictEqual(entries[0].key, 'api_key');
			assert.strictEqual(entries[0].value, '"secret123"');  // Includes quotes for JSON
		});

		test('parses YAML files', () => {
			const doc = createMockDocument('api_key: secret123', 'yaml', '/project/config.yaml');
			const entries = parseConfigDocument(doc as any);

			assert.strictEqual(entries.length, 1);
			assert.strictEqual(entries[0].key, 'api_key');
			assert.strictEqual(entries[0].value, 'secret123');
		});

		test('returns empty array for unknown file types', () => {
			const doc = createMockDocument('some content', 'plaintext', '/project/readme.txt');
			const entries = parseConfigDocument(doc as any);

			assert.strictEqual(entries.length, 0);
		});

		test('handles .env.local files', () => {
			const doc = createMockDocument('LOCAL_KEY=value', 'dotenv', '/project/.env.local');
			const entries = parseConfigDocument(doc as any);

			assert.strictEqual(entries.length, 1);
			assert.strictEqual(entries[0].key, 'LOCAL_KEY');
		});

		test('handles .yml extension', () => {
			const doc = createMockDocument('api_key: secret', 'yml', '/project/docker-compose.yml');
			const entries = parseConfigDocument(doc as any);

			assert.strictEqual(entries.length, 1);
			assert.strictEqual(entries[0].key, 'api_key');
		});
	});

	suite('isSupportedConfigFile', () => {
		test('returns true for .env files', () => {
			const doc = createMockDocument('API_KEY=secret', 'dotenv', '/project/.env');
			assert.strictEqual(isSupportedConfigFile(doc as any), true);
		});

		test('returns true for JSON files', () => {
			const doc = createMockDocument('{}', 'json', '/project/config.json');
			assert.strictEqual(isSupportedConfigFile(doc as any), true);
		});

		test('returns true for YAML files', () => {
			const doc = createMockDocument('key: value', 'yaml', '/project/config.yaml');
			assert.strictEqual(isSupportedConfigFile(doc as any), true);
		});

		test('returns false for unsupported files', () => {
			const doc = createMockDocument('content', 'plaintext', '/project/readme.txt');
			assert.strictEqual(isSupportedConfigFile(doc as any), false);
		});

		test('returns true for .env files by extension only', () => {
			const doc = createMockDocument('KEY=value', 'plaintext', '/project/.env.production');
			assert.strictEqual(isSupportedConfigFile(doc as any), true);
		});
	});

	suite('Cross-format consistency', () => {
		test('all parsers return entries with same structure', () => {
			const envDoc = createMockDocument('API_KEY=secret', 'dotenv', '/.env');
			const jsonDoc = createMockDocument('{"api_key": "secret"}', 'json', '/config.json');
			const yamlDoc = createMockDocument('api_key: secret', 'yaml', '/config.yaml');

			const envEntries = parseConfigDocument(envDoc as any);
			const jsonEntries = parseConfigDocument(jsonDoc as any);
			const yamlEntries = parseConfigDocument(yamlDoc as any);

			// All should return exactly one entry
			assert.strictEqual(envEntries.length, 1);
			assert.strictEqual(jsonEntries.length, 1);
			assert.strictEqual(yamlEntries.length, 1);

			// All entries should have the required properties
			for (const entries of [envEntries, jsonEntries, yamlEntries]) {
				const entry = entries[0];
				assert.ok('key' in entry, 'Entry should have key property');
				assert.ok('value' in entry, 'Entry should have value property');
				assert.ok('line' in entry, 'Entry should have line property');
				assert.ok('valueStart' in entry, 'Entry should have valueStart property');
				assert.ok('valueEnd' in entry, 'Entry should have valueEnd property');
			}
		});

		test('value positions are within line bounds', () => {
			const doc = createMockDocument('api_key: "very_long_secret_value_here"', 'yaml', '/config.yaml');
			const entries = parseConfigDocument(doc as any);

			assert.strictEqual(entries.length, 1);
			const entry = entries[0];
			const lineText = 'api_key: "very_long_secret_value_here"';

			assert.ok(entry.valueStart >= 0, 'valueStart should be non-negative');
			assert.ok(entry.valueEnd <= lineText.length, 'valueEnd should not exceed line length');
			assert.ok(entry.valueStart < entry.valueEnd, 'valueStart should be less than valueEnd');
		});
	});
});
