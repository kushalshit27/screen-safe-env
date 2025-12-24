/**
 * jsonParser.ts
 * Parses JSON config files and extracts key/value ranges for masking.
 */

import * as vscode from 'vscode';
import { EnvEntry } from './envParser';

/**
 * Parses a JSON document and returns an array of EnvEntry objects.
 * Extracts all string values from the JSON structure.
 * For JSON, the value range includes the surrounding quotes.
 *
 * @param document The VS Code text document to parse
 * @returns Array of EnvEntry objects
 */
export function parseJsonDocument(document: vscode.TextDocument): EnvEntry[] {
	const entries: EnvEntry[] = [];
	const text = document.getText();

	// Use regex to find all "key": "value" patterns
	// This approach works line-by-line for accurate position tracking
	for (let lineIndex = 0; lineIndex < document.lineCount; lineIndex++) {
		const line = document.lineAt(lineIndex);
		const lineText = line.text;

		// Match "key": "value" or 'key': 'value' patterns
		// Also handles "key": 'value' and 'key': "value"
		const pattern = /["']([^"']+)["']\s*:\s*(["'])([^"']*)\2/g;
		let match;

		while ((match = pattern.exec(lineText)) !== null) {
			const key = match[1];
			const quote = match[2];  // The quote character used
			const value = match[3];  // The value without quotes

			// Find the position of the value string (including quotes)
			const fullMatch = match[0];
			const matchStart = match.index;

			// Find where the opening quote of the value starts
			const colonIndex = fullMatch.indexOf(':');
			const afterColon = fullMatch.substring(colonIndex + 1);
			const valueQuoteMatch = afterColon.match(/\s*/);

			if (valueQuoteMatch !== null) {
				// valueStart is at the opening quote
				const valueStart = matchStart + colonIndex + 1 + valueQuoteMatch[0].length;
				// valueEnd is after the closing quote (value + 2 quotes)
				const valueEnd = valueStart + value.length + 2;

				entries.push({
					key,
					value: quote + value + quote,  // Include quotes in the value for masking
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
 * Checks if a document is a JSON file based on language ID or file extension.
 */
export function isJsonDocument(document: vscode.TextDocument): boolean {
	if (document.languageId === 'json' || document.languageId === 'jsonc') {
		return true;
	}

	const fileName = document.fileName.toLowerCase();
	return fileName.endsWith('.json');
}
