/**
 * globMatcher.ts
 * Utility for matching file paths against glob patterns.
 * Uses VS Code's built-in RelativePattern for consistent behavior.
 */

import * as vscode from 'vscode';
import * as path from 'path';

/**
 * Checks if a file URI matches any of the given glob patterns.
 * Patterns are matched against the file path relative to workspace folders.
 *
 * @param uri - The file URI to check
 * @param patterns - Array of glob patterns (e.g., ['**\/.env*', '*.env'])
 * @returns true if the file matches at least one pattern
 */
export function matchesGlobPatterns(
	uri: vscode.Uri,
	patterns: string[]
): boolean {
	if (patterns.length === 0) {
		return true; // No patterns means match all
	}

	const filePath = uri.fsPath;
	const fileName = path.basename(filePath);

	for (const pattern of patterns) {
		if (matchesPattern(filePath, fileName, pattern)) {
			return true;
		}
	}

	return false;
}

/**
 * Matches a single pattern against a file path.
 * Supports simple glob patterns:
 * - '*' matches any characters except path separator
 * - '**' matches any characters including path separator
 * - '?' matches single character
 */
function matchesPattern(
	filePath: string,
	fileName: string,
	pattern: string
): boolean {
	// Normalize path separators
	const normalizedPath = filePath.replace(/\\/g, '/');
	const normalizedPattern = pattern.replace(/\\/g, '/');

	// If pattern doesn't contain path separator, match against filename only
	if (!normalizedPattern.includes('/')) {
		return matchGlob(fileName, normalizedPattern);
	}

	// For patterns with paths, check if path ends with the pattern
	// or matches the full path
	return matchGlob(normalizedPath, normalizedPattern);
}

/**
 * Simple glob matching implementation.
 * Converts glob pattern to regex and tests against the string.
 */
function matchGlob(str: string, pattern: string): boolean {
	// Escape regex special characters except glob wildcards
	let regexStr = pattern
		.replace(/[.+^${}()|[\]\\]/g, '\\$&')
		// Handle ** (match anything including /)
		.replace(/\*\*/g, '.*')
		// Handle * (match anything except /)
		.replace(/(?<!\\.)\*/g, '[^/]*')
		// Handle ? (match single char)
		.replace(/\?/g, '.');

	// Anchor the pattern
	const regex = new RegExp(`^${regexStr}$`, 'i');
	return regex.test(str);
}

/**
 * Gets the include patterns from configuration.
 */
export function getIncludePatterns(): string[] {
	const config = vscode.workspace.getConfiguration('screenSafeEnv');
	return config.get<string[]>('include', ['**/.env*', '*.env']);
}

/**
 * Determines if a document should be processed based on include patterns.
 * First checks language ID, then checks glob patterns.
 *
 * @param document - The text document to check
 * @returns true if the document should have decorations applied
 */
export function shouldProcessDocument(document: vscode.TextDocument): boolean {
	// First, check if it's a dotenv file by language ID
	if (document.languageId !== 'dotenv') {
		return false;
	}

	// Then check against include patterns
	const patterns = getIncludePatterns();
	return matchesGlobPatterns(document.uri, patterns);
}
