/**
 * hoverProvider.ts
 * Provides hover information for masked .env values.
 * Gated by the hoverReveal configuration setting.
 */

import * as vscode from 'vscode';
import { parseEnvDocument, filterExcludedKeys, EnvEntry } from './envParser';

/**
 * HoverProvider for dotenv files.
 * Shows the actual value when hovering over a masked secret.
 */
export class EnvHoverProvider implements vscode.HoverProvider {
	/**
	 * Checks if hover reveal is enabled in configuration.
	 */
	private isHoverRevealEnabled(): boolean {
		const config = vscode.workspace.getConfiguration('screenSafeEnv');
		return config.get<boolean>('hoverReveal', false);
	}

	/**
	 * Checks if masking is enabled.
	 */
	private isMaskingEnabled(): boolean {
		const config = vscode.workspace.getConfiguration('screenSafeEnv');
		return config.get<boolean>('enable', true);
	}

	/**
	 * Gets the excluded keys from configuration.
	 */
	private getExcludedKeys(): string[] {
		const config = vscode.workspace.getConfiguration('screenSafeEnv');
		return config.get<string[]>('excludeKeys', ['PORT', 'DEBUG']);
	}

	/**
	 * Finds the entry at the given position.
	 */
	private findEntryAtPosition(
		entries: EnvEntry[],
		position: vscode.Position
	): EnvEntry | undefined {
		return entries.find((entry) => {
			if (entry.line !== position.line) {
				return false;
			}
			// Check if position is within the value range
			return position.character >= entry.valueStart && 
			       position.character <= entry.valueEnd;
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
		// Only provide hover if both masking and hover reveal are enabled
		if (!this.isMaskingEnabled() || !this.isHoverRevealEnabled()) {
			return null;
		}

		// Parse the document
		const entries = parseEnvDocument(document);
		const excludedKeys = this.getExcludedKeys();
		const filteredEntries = filterExcludedKeys(entries, excludedKeys);

		// Find the entry at the hover position
		const entry = this.findEntryAtPosition(filteredEntries, position);
		if (!entry || entry.value.length === 0) {
			return null;
		}

		// Create hover content with privacy warning
		const hoverContent = new vscode.MarkdownString();
		hoverContent.isTrusted = true;

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
 * Registers the hover provider for dotenv files.
 * The provider internally checks the hoverReveal setting.
 */
export function registerHoverProvider(
	context: vscode.ExtensionContext
): vscode.Disposable {
	const provider = new EnvHoverProvider();
	const registration = vscode.languages.registerHoverProvider(
		{ language: 'dotenv' },
		provider
	);
	context.subscriptions.push(registration);
	return registration;
}
