/**
 * index.ts
 * Barrel export for all parsers and unified parsing interface.
 */

import * as vscode from 'vscode';
import { EnvEntry, parseEnvDocument, filterExcludedKeys } from './envParser';
import { parseJsonDocument, isJsonDocument } from './jsonParser';
import { parseYamlDocument, isYamlDocument } from './yamlParser';

export { EnvEntry, filterExcludedKeys } from './envParser';
export { parseJsonDocument, isJsonDocument } from './jsonParser';
export { parseYamlDocument, isYamlDocument } from './yamlParser';

/**
 * File type enum for supported config formats.
 */
export type ConfigFileType = 'env' | 'json' | 'yaml' | 'unknown';

/**
 * Detects the config file type based on document properties.
 */
export function detectFileType(document: vscode.TextDocument): ConfigFileType {
	// Check language ID first
	if (document.languageId === 'dotenv') {
		return 'env';
	}

	if (isJsonDocument(document)) {
		return 'json';
	}

	if (isYamlDocument(document)) {
		return 'yaml';
	}

	// Fallback: check file extension
	const fileName = document.fileName.toLowerCase();

	if (fileName.includes('.env')) {
		return 'env';
	}

	if (fileName.endsWith('.json')) {
		return 'json';
	}

	if (fileName.endsWith('.yaml') || fileName.endsWith('.yml')) {
		return 'yaml';
	}

	return 'unknown';
}

/**
 * Unified parsing function that detects file type and uses appropriate parser.
 *
 * @param document The VS Code text document to parse
 * @returns Array of EnvEntry objects
 */
export function parseConfigDocument(document: vscode.TextDocument): EnvEntry[] {
	const fileType = detectFileType(document);

	switch (fileType) {
		case 'env':
			return parseEnvDocument(document);
		case 'json':
			return parseJsonDocument(document);
		case 'yaml':
			return parseYamlDocument(document);
		default:
			return [];
	}
}

/**
 * Checks if a document is a supported config file type.
 */
export function isSupportedConfigFile(document: vscode.TextDocument): boolean {
	return detectFileType(document) !== 'unknown';
}
