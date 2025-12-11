/**
 * hoverProvider.ts
 * Provides hover information for masked config values.
 * Gated by the hoverReveal configuration setting.
 */

import * as vscode from 'vscode';
import { parseConfigDocument, filterExcludedKeys, EnvEntry } from './parsers';

/**
 * HoverProvider for config files (env, JSON, YAML).
 * Shows the actual value when hovering over a masked secret.
 */
export class EnvHoverProvider implements vscode.HoverProvider {
	/**
	 * Gets a configuration object scoped to the current document URI if provided.
	 */
	private getConfig(documentUri?: vscode.Uri): vscode.WorkspaceConfiguration {
		return vscode.workspace.getConfiguration('screenSafeEnv', documentUri);
	}

	/**
	 * Checks if hover reveal is enabled in configuration.
	 */
	private isHoverRevealEnabled(documentUri?: vscode.Uri): boolean {
		const config = this.getConfig(documentUri);
		return config.get<boolean>('hoverReveal', false);
	}

	/**
	 * Checks if masking is enabled.
	 */
	private isMaskingEnabled(documentUri?: vscode.Uri): boolean {
		const config = this.getConfig(documentUri);
		return config.get<boolean>('enable', true);
	}

	/**
	 * Gets the excluded keys from configuration.
	 */
	private getExcludedKeys(documentUri?: vscode.Uri): string[] {
		const config = this.getConfig(documentUri);
		return config.get<string[]>('excludeKeys', ['PORT', 'DEBUG']);
	}

	/**
	 * Finds the entry at the given position.
	 * Checks if the cursor is on the value portion of an env entry.
	 */
	private findEntryAtPosition(
		entries: EnvEntry[],
		position: vscode.Position
	): EnvEntry | undefined {
		return entries.find((entry) => {
			if (entry.line !== position.line) {
				return false;
			}
			// valueEnd is exclusive; allow an inclusive hover window with tolerance
			const start = Math.max(0, entry.valueStart - 2); // tolerate slight offsets (mask rendering)
			const endInclusive = Math.max(start, entry.valueEnd - 1 + 2); // include a couple chars past end
			return position.character >= start && position.character <= endInclusive;
		});
	}

	/**
	 * Provides hover information for masked environment variables.
	 */
	public provideHover(
		document: vscode.TextDocument,
		position: vscode.Position,
		_token: vscode.CancellationToken
	): vscode.ProviderResult<vscode.Hover> {
		console.log(`[Screen Safe ENV] provideHover called - lang: ${document.languageId}, pos: ${position.line}:${position.character}`);
		
		// Only provide hover if both masking and hover reveal are enabled
		if (!this.isMaskingEnabled(document.uri)) {
			console.log('[Screen Safe ENV] Masking is disabled, skipping hover');
			return null;
		}
		
		if (!this.isHoverRevealEnabled(document.uri)) {
			console.log('[Screen Safe ENV] Hover reveal is disabled, skipping hover');
			return null;
		}

		// Parse the document
		const entries = parseConfigDocument(document);
		const excludedKeys = this.getExcludedKeys(document.uri);
		const filteredEntries = filterExcludedKeys(entries, excludedKeys);
		
		console.log(`[Screen Safe ENV] Found ${filteredEntries.length} entries`);

		// Find the entry at the hover position
		const entry = this.findEntryAtPosition(filteredEntries, position);
		if (!entry) {
			console.log('[Screen Safe ENV] No entry found at position', {
				position: { line: position.line, character: position.character },
				entries: filteredEntries.map((e) => ({
					key: e.key,
					line: e.line,
					valueStart: e.valueStart,
					valueEnd: e.valueEnd,
					value: e.value,
				})),
			});
			return null;
		}
		
		if (entry.value.length === 0) {
			console.log('[Screen Safe ENV] Entry has empty value, skipping hover');
			return null;
		}
		
		console.log(`[Screen Safe ENV] Showing hover for ${entry.key}`);

		// Create hover content with privacy warning
		const hoverContent = new vscode.MarkdownString();
		hoverContent.isTrusted = true;
		hoverContent.supportThemeIcons = true;  // Enable $(icon) syntax

		// Add privacy warning icon and text
		hoverContent.appendMarkdown('$(warning) **Screen Safe ENV - Hover Reveal**\n\n');
		hoverContent.appendMarkdown('---\n\n');
		
		// Show the key and value
		hoverContent.appendMarkdown(`**${entry.key}**\n\n`);
		hoverContent.appendCodeblock(entry.value, 'plaintext');
		
		// Add privacy notice
		hoverContent.appendMarkdown('\n---\n\n');
		hoverContent.appendMarkdown(
			'*$(info) This value is currently masked. ' +
			'Disable hover reveal in settings if you\'re screen sharing.*'
		);

		// Create the range for the hover
		const range = new vscode.Range(
			entry.line,
			entry.valueStart,
			entry.line,
			entry.valueEnd
		);

		return new vscode.Hover(hoverContent, range);
	}
}

/**
 * Registers the hover provider for config files (env, JSON, YAML).
 * The provider internally checks the hoverReveal setting.
 */
export function registerHoverProvider(
	context: vscode.ExtensionContext
): vscode.Disposable {
	const provider = new EnvHoverProvider();
	// Register for all supported file types
	const selectors: vscode.DocumentSelector = [
		// dotenv files
		{ language: 'dotenv', scheme: 'file' },
		{ language: 'dotenv', scheme: 'untitled' },
		{ language: 'dotenv' },
		{ scheme: 'file', pattern: '**/.env*' },
		{ scheme: 'file', pattern: '**/*.env' },
		// JSON files
		{ language: 'json', scheme: 'file' },
		{ language: 'jsonc', scheme: 'file' },
		{ scheme: 'file', pattern: '**/*.json' },
		// YAML files
		{ language: 'yaml', scheme: 'file' },
		{ scheme: 'file', pattern: '**/*.yaml' },
		{ scheme: 'file', pattern: '**/*.yml' },
	];

	const registration = vscode.languages.registerHoverProvider(selectors, provider);
	context.subscriptions.push(registration);
	return registration;
}
