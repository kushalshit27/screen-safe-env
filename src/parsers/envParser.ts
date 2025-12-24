/**
 * envParser.ts
 * Parses .env file content and extracts key/value ranges for masking.
 */

import * as vscode from 'vscode';

/**
 * Represents a parsed environment variable entry.
 */
export interface EnvEntry {
	/** The variable key (e.g., "API_KEY") */
	key: string;
	/** The variable value (e.g., "secret123") */
	value: string;
	/** Line number (0-indexed) */
	line: number;
	/** Start column of the value (0-indexed) */
	valueStart: number;
	/** End column of the value (0-indexed, exclusive) */
	valueEnd: number;
}

/**
 * Parses .env file content and returns an array of EnvEntry objects.
 *
 * Handles:
 * - Standard KEY=VALUE pairs
 * - Quoted values (single and double quotes)
 * - Comments (lines starting with #)
 * - Empty values
 * - Values containing = signs
 * - Inline comments (after unquoted values)
 *
 * @param document The VS Code text document to parse
 * @returns Array of EnvEntry objects
 */
export function parseEnvDocument(document: vscode.TextDocument): EnvEntry[] {
	const entries: EnvEntry[] = [];
	const lineCount = document.lineCount;

	for (let lineIndex = 0; lineIndex < lineCount; lineIndex++) {
		const line = document.lineAt(lineIndex);
		const text = line.text;

		// Skip empty lines and comments
		const trimmed = text.trim();
		if (trimmed === '' || trimmed.startsWith('#')) {
			continue;
		}

		// Match KEY=VALUE pattern with optional 'export' prefix
		// Key: starts with letter or underscore, followed by alphanumeric or underscore
		// Value: everything after the first =
		const match = text.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)/);
		if (!match) {
			continue;
		}

		const key = match[1];
		const rawValue = match[2];

		// Calculate value start position (find the = after the key)
		const keyIndex = text.indexOf(key);
		const equalsIndex = text.indexOf('=', keyIndex + key.length);
		let valueStart = equalsIndex + 1;

		// Skip whitespace after =
		while (valueStart < text.length && (text[valueStart] === ' ' || text[valueStart] === '\t')) {
			valueStart++;
		}

		// Parse the value, handling quotes
		const { value, valueEnd } = parseValue(text, valueStart);

		entries.push({
			key,
			value,
			line: lineIndex,
			valueStart,
			valueEnd,
		});
	}

	return entries;
}

/**
 * Parses a value starting at the given position, handling quotes and inline comments.
 */
function parseValue(
	text: string,
	startPos: number
): { value: string; valueEnd: number } {
	if (startPos >= text.length) {
		// Empty value
		return { value: '', valueEnd: startPos };
	}

	const firstChar = text[startPos];

	// Handle quoted values
	if (firstChar === '"' || firstChar === "'") {
		const quote = firstChar;
		let endQuotePos = -1;
		let escaped = false;

		for (let i = startPos + 1; i < text.length; i++) {
			if (escaped) {
				escaped = false;
				continue;
			}
			if (text[i] === '\\') {
				escaped = true;
				continue;
			}
			if (text[i] === quote) {
				endQuotePos = i;
				break;
			}
		}

		if (endQuotePos !== -1) {
			// Include the quotes in the masked range
			const value = text.substring(startPos + 1, endQuotePos);
			return { value, valueEnd: endQuotePos + 1 };
		} else {
			// Unclosed quote - treat rest of line as value
			const value = text.substring(startPos + 1);
			return { value, valueEnd: text.length };
		}
	}

	// Unquoted value - find end (stop at inline comment or end of line)
	let valueEnd = text.length;
	for (let i = startPos; i < text.length; i++) {
		// Check for inline comment (space followed by #)
		if (text[i] === ' ' || text[i] === '\t') {
			const rest = text.substring(i).trim();
			if (rest.startsWith('#')) {
				valueEnd = i;
				break;
			}
		}
	}

	// Trim trailing whitespace from unquoted values
	while (valueEnd > startPos && (text[valueEnd - 1] === ' ' || text[valueEnd - 1] === '\t')) {
		valueEnd--;
	}

	const value = text.substring(startPos, valueEnd);
	return { value, valueEnd };
}

/**
 * Filters entries based on excluded keys.
 *
 * @param entries Array of EnvEntry objects
 * @param excludeKeys Array of key names to exclude from masking
 * @returns Filtered array of EnvEntry objects
 */
export function filterExcludedKeys(
	entries: EnvEntry[],
	excludeKeys: string[]
): EnvEntry[] {
	const excludeSet = new Set(excludeKeys.map((k) => k.toUpperCase()));
	return entries.filter((entry) => !excludeSet.has(entry.key.toUpperCase()));
}
