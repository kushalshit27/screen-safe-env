import * as assert from 'assert';
import { parseEnvDocument, filterExcludedKeys, EnvEntry } from '../parsers/envParser';

// Mock TextDocument for testing
function createMockDocument(content: string): { getText: () => string; lineCount: number; lineAt: (line: number) => { text: string } } {
	const lines = content.split('\n');
	return {
		getText: () => content,
		lineCount: lines.length,
		lineAt: (line: number) => ({ text: lines[line] || '' }),
	};
}

suite('envParser Test Suite', () => {
	suite('parseEnvDocument', () => {
		test('parses simple key-value pairs', () => {
			const doc = createMockDocument('API_KEY=secret123\nDB_HOST=localhost');
			const entries = parseEnvDocument(doc as any);

			assert.strictEqual(entries.length, 2);
			assert.strictEqual(entries[0].key, 'API_KEY');
			assert.strictEqual(entries[0].value, 'secret123');
			assert.strictEqual(entries[0].line, 0);
			assert.strictEqual(entries[1].key, 'DB_HOST');
			assert.strictEqual(entries[1].value, 'localhost');
			assert.strictEqual(entries[1].line, 1);
		});

		test('handles double-quoted values', () => {
			const doc = createMockDocument('MESSAGE="Hello World"');
			const entries = parseEnvDocument(doc as any);

			assert.strictEqual(entries.length, 1);
			assert.strictEqual(entries[0].key, 'MESSAGE');
			assert.strictEqual(entries[0].value, 'Hello World');
		});

		test('handles single-quoted values', () => {
			const doc = createMockDocument("PASSWORD='p@ss=word'");
			const entries = parseEnvDocument(doc as any);

			assert.strictEqual(entries.length, 1);
			assert.strictEqual(entries[0].key, 'PASSWORD');
			assert.strictEqual(entries[0].value, 'p@ss=word');
		});

		test('handles empty values', () => {
			const doc = createMockDocument('EMPTY_VAR=');
			const entries = parseEnvDocument(doc as any);

			assert.strictEqual(entries.length, 1);
			assert.strictEqual(entries[0].key, 'EMPTY_VAR');
			assert.strictEqual(entries[0].value, '');
		});

		test('skips comment lines', () => {
			const doc = createMockDocument('# This is a comment\nAPI_KEY=value\n# Another comment');
			const entries = parseEnvDocument(doc as any);

			assert.strictEqual(entries.length, 1);
			assert.strictEqual(entries[0].key, 'API_KEY');
		});

		test('skips empty lines', () => {
			const doc = createMockDocument('KEY1=val1\n\nKEY2=val2\n   \nKEY3=val3');
			const entries = parseEnvDocument(doc as any);

			assert.strictEqual(entries.length, 3);
		});

		test('handles inline comments (unquoted)', () => {
			const doc = createMockDocument('HOST=localhost # this is the host');
			const entries = parseEnvDocument(doc as any);

			assert.strictEqual(entries.length, 1);
			assert.strictEqual(entries[0].value, 'localhost');
		});

		test('preserves inline comments in quoted values', () => {
			const doc = createMockDocument('MSG="contains # hash"');
			const entries = parseEnvDocument(doc as any);

			assert.strictEqual(entries.length, 1);
			assert.strictEqual(entries[0].value, 'contains # hash');
		});

		test('handles export prefix', () => {
			const doc = createMockDocument('export API_KEY=exported_value');
			const entries = parseEnvDocument(doc as any);

			assert.strictEqual(entries.length, 1);
			assert.strictEqual(entries[0].key, 'API_KEY');
			assert.strictEqual(entries[0].value, 'exported_value');
		});

		test('handles values with equals sign', () => {
			const doc = createMockDocument('URL=https://example.com?foo=bar');
			const entries = parseEnvDocument(doc as any);

			assert.strictEqual(entries.length, 1);
			assert.strictEqual(entries[0].key, 'URL');
			assert.strictEqual(entries[0].value, 'https://example.com?foo=bar');
		});

		test('calculates correct value positions', () => {
			const doc = createMockDocument('SHORT=abc\nLONGER_KEY=value');
			const entries = parseEnvDocument(doc as any);

			// SHORT=abc -> valueStart at position 6 (after 'SHORT=')
			assert.strictEqual(entries[0].valueStart, 6);
			assert.strictEqual(entries[0].valueEnd, 9); // 'abc' is 3 chars

			// LONGER_KEY=value -> valueStart at position 11 (after 'LONGER_KEY=')
			assert.strictEqual(entries[1].valueStart, 11);
			assert.strictEqual(entries[1].valueEnd, 16); // 'value' is 5 chars
		});

		test('handles multiline values (escaped)', () => {
			// Note: Basic parser treats each line independently
			const doc = createMockDocument('MULTI="line1\\nline2"');
			const entries = parseEnvDocument(doc as any);

			assert.strictEqual(entries.length, 1);
			assert.strictEqual(entries[0].key, 'MULTI');
		});
	});

	suite('filterExcludedKeys', () => {
		test('filters out excluded keys (exact match)', () => {
			const entries: EnvEntry[] = [
				{ key: 'API_KEY', value: 'secret', line: 0, valueStart: 8, valueEnd: 14 },
				{ key: 'DEBUG', value: 'true', line: 1, valueStart: 6, valueEnd: 10 },
				{ key: 'PASSWORD', value: 'pass', line: 2, valueStart: 9, valueEnd: 13 },
			];
			const excludePatterns = ['DEBUG'];

			const filtered = filterExcludedKeys(entries, excludePatterns);

			assert.strictEqual(filtered.length, 2);
			assert.ok(filtered.every((e) => e.key !== 'DEBUG'));
		});

		test('filters exact keys (case-insensitive)', () => {
			const entries: EnvEntry[] = [
				{ key: 'AWS_KEY', value: 'val1', line: 0, valueStart: 8, valueEnd: 12 },
				{ key: 'AWS_SECRET', value: 'val2', line: 1, valueStart: 11, valueEnd: 15 },
				{ key: 'GCP_KEY', value: 'val3', line: 2, valueStart: 8, valueEnd: 12 },
			];
			const excludePatterns = ['AWS_KEY'];

			const filtered = filterExcludedKeys(entries, excludePatterns);

			assert.strictEqual(filtered.length, 2);
			assert.strictEqual(filtered[0].key, 'AWS_SECRET');
			assert.strictEqual(filtered[1].key, 'GCP_KEY');
		});

		test('handles multiple exclude keys', () => {
			const entries: EnvEntry[] = [
				{ key: 'API_KEY', value: 'secret', line: 0, valueStart: 8, valueEnd: 14 },
				{ key: 'DEBUG', value: 'true', line: 1, valueStart: 6, valueEnd: 10 },
				{ key: 'NODE_Env', value: 'prod', line: 2, valueStart: 9, valueEnd: 13 },
			];
			const excludePatterns = ['DEBUG', 'NODE_Env'];

			const filtered = filterExcludedKeys(entries, excludePatterns);

			assert.strictEqual(filtered.length, 1);
			assert.strictEqual(filtered[0].key, 'API_KEY');
		});

		test('returns all entries when excludePatterns is empty', () => {
			const entries: EnvEntry[] = [
				{ key: 'KEY1', value: 'v1', line: 0, valueStart: 5, valueEnd: 7 },
				{ key: 'KEY2', value: 'v2', line: 1, valueStart: 5, valueEnd: 7 },
			];

			const filtered = filterExcludedKeys(entries, []);

			assert.strictEqual(filtered.length, 2);
		});

		test('handles case-insensitive matching', () => {
			const entries: EnvEntry[] = [
				{ key: 'api_key', value: 'lower', line: 0, valueStart: 8, valueEnd: 13 },
				{ key: 'API_KEY', value: 'upper', line: 1, valueStart: 8, valueEnd: 13 },
			];
			const excludePatterns = ['API_KEY'];

			const filtered = filterExcludedKeys(entries, excludePatterns);

			// Both should be filtered (case-insensitive)
			assert.strictEqual(filtered.length, 0);
		});
	});
});
