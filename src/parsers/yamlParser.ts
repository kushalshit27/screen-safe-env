/**
 * yamlParser.ts
 * Parses YAML config files and extracts key/value ranges for masking.
 */

import * as vscode from 'vscode';
import { EnvEntry } from './envParser';

/**
 * Parses a YAML document and returns an array of EnvEntry objects.
 * Extracts key-value pairs from the YAML structure.
 *
 * @param document The VS Code text document to parse
 * @returns Array of EnvEntry objects
 */
export function parseYamlDocument(document: vscode.TextDocument): EnvEntry[] {
	const entries: EnvEntry[] = [];

	for (let lineIndex = 0; lineIndex < document.lineCount; lineIndex++) {
		const line = document.lineAt(lineIndex);
		const lineText = line.text;

		// Skip empty lines and comments
		const trimmed = lineText.trim();
		if (trimmed === '' || trimmed.startsWith('#')) {
			continue;
		}

		// Skip list items that are just values (- value)
		if (trimmed.startsWith('- ') && !trimmed.includes(':')) {
			continue;
		}

		// Match key: value patterns
		// Handles: key: value, key: "value", key: 'value'
		// Also handles nested keys like:  nested_key: value
		const keyValueMatch = lineText.match(/^(\s*)([a-zA-Z_][a-zA-Z0-9_.-]*)\s*:\s*(.*)$/);

		if (keyValueMatch) {
			const indent = keyValueMatch[1];
			const key = keyValueMatch[2];
			let valueStr = keyValueMatch[3].trim();

			// Skip if value is empty (likely a parent key for nested structure)
			if (valueStr === '' || valueStr === '|' || valueStr === '>' || valueStr === '|-' || valueStr === '>-') {
				continue;
			}

			// Skip if it looks like a nested object or array start
			if (valueStr === '{' || valueStr === '[') {
				continue;
			}

			// Remove inline comments
			const commentIndex = findInlineComment(valueStr);
			if (commentIndex !== -1) {
				valueStr = valueStr.substring(0, commentIndex).trim();
			}

			// Calculate positions
			const colonIndex = lineText.indexOf(':');
			let valueStart = colonIndex + 1;

			// Skip whitespace after colon
			while (valueStart < lineText.length && (lineText[valueStart] === ' ' || lineText[valueStart] === '\t')) {
				valueStart++;
			}

			// Parse the value, handling quotes
			const { value, valueEnd } = parseYamlValue(lineText, valueStart);

			if (value.length > 0) {
				entries.push({
					key,
					value,
					line: lineIndex,
					valueStart,
					valueEnd,
				});
			}
		}
	}

	return entries;
}

/**
 * Finds inline comment position in YAML value, respecting quoted strings.
 */
function findInlineComment(valueStr: string): number {
	let inSingleQuote = false;
	let inDoubleQuote = false;

	for (let i = 0; i < valueStr.length; i++) {
		const char = valueStr[i];

		if (char === "'" && !inDoubleQuote) {
			inSingleQuote = !inSingleQuote;
		} else if (char === '"' && !inSingleQuote) {
			inDoubleQuote = !inDoubleQuote;
		} else if (char === '#' && !inSingleQuote && !inDoubleQuote) {
			// Check if preceded by whitespace
			if (i > 0 && (valueStr[i - 1] === ' ' || valueStr[i - 1] === '\t')) {
				return i - 1;
			}
		}
	}

	return -1;
}

/**
 * Parses a YAML value starting at the given position, handling quotes.
 */
function parseYamlValue(
	text: string,
	startPos: number
): { value: string; valueEnd: number } {
	if (startPos >= text.length) {
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
			const value = text.substring(startPos + 1, endQuotePos);
			return { value, valueEnd: endQuotePos + 1 };
		} else {
			const value = text.substring(startPos + 1);
			return { value, valueEnd: text.length };
		}
	}

	// Unquoted value - read until end of line or inline comment
	let valueEnd = text.length;

	// Find inline comment
	let inSingleQuote = false;
	let inDoubleQuote = false;
	for (let i = startPos; i < text.length; i++) {
		const char = text[i];

		if (char === "'" && !inDoubleQuote) {
			inSingleQuote = !inSingleQuote;
		} else if (char === '"' && !inSingleQuote) {
			inDoubleQuote = !inDoubleQuote;
		} else if (char === '#' && !inSingleQuote && !inDoubleQuote) {
			if (i > startPos && (text[i - 1] === ' ' || text[i - 1] === '\t')) {
				valueEnd = i - 1;
				break;
			}
		}
	}

	// Trim trailing whitespace
	while (valueEnd > startPos && (text[valueEnd - 1] === ' ' || text[valueEnd - 1] === '\t')) {
		valueEnd--;
	}

	const value = text.substring(startPos, valueEnd);
	return { value, valueEnd };
}

/**
 * Checks if a document is a YAML file based on language ID or file extension.
 */
export function isYamlDocument(document: vscode.TextDocument): boolean {
	if (document.languageId === 'yaml' || document.languageId === 'yml') {
		return true;
	}

	const fileName = document.fileName.toLowerCase();
	return fileName.endsWith('.yaml') || fileName.endsWith('.yml');
}
