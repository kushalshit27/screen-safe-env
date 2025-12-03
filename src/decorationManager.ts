/**
 * decorationManager.ts
 * Manages text decorations for masking .env values in VS Code.
 */

import * as vscode from 'vscode';
import { parseEnvDocument, filterExcludedKeys, EnvEntry } from './envParser';
import { shouldProcessDocument } from './utils/globMatcher';

export type MaskMode = 'solid' | 'lengthPreserving' | 'partial';

/**
 * DecorationManager handles creating and applying decorations to mask
 * environment variable values in .env files.
 */
export class DecorationManager {
	private decorationType: vscode.TextEditorDecorationType | undefined;
	private readonly disposables: vscode.Disposable[] = [];

	constructor() {
		this.createDecorationType();
	}

	/**
	 * Creates or recreates the decoration type based on current configuration.
	 */
	private createDecorationType(): void {
		// Dispose existing decoration type if any
		if (this.decorationType) {
			this.decorationType.dispose();
		}

		// Create decoration with a mask appearance
		// We use `after` content to overlay the mask text
		this.decorationType = vscode.window.createTextEditorDecorationType({
			opacity: '0',
			after: {
				contentText: '', // Will be set per-decoration
				color: new vscode.ThemeColor('editorInfo.foreground'),
				backgroundColor: new vscode.ThemeColor('editor.selectionBackground'),
			},
		});
	}

	/**
	 * Gets the current mask mode from configuration.
	 */
	private getMaskMode(): MaskMode {
		const config = vscode.workspace.getConfiguration('screenSafeEnv');
		return config.get<MaskMode>('maskMode', 'solid');
	}

	/**
	 * Gets the excluded keys from configuration.
	 */
	private getExcludedKeys(): string[] {
		const config = vscode.workspace.getConfiguration('screenSafeEnv');
		return config.get<string[]>('excludeKeys', ['PORT', 'DEBUG']);
	}

	/**
	 * Checks if masking is enabled.
	 */
	private isEnabled(): boolean {
		const config = vscode.workspace.getConfiguration('screenSafeEnv');
		return config.get<boolean>('enable', true);
	}

	/**
	 * Generates a mask string based on the mask mode and value.
	 */
	private generateMask(value: string, mode: MaskMode): string {
		if (value.length === 0) {
			return '';
		}

		switch (mode) {
			case 'solid':
				return '*****';

			case 'lengthPreserving':
				return '*'.repeat(value.length);

			case 'partial':
				if (value.length <= 4) {
					return '*'.repeat(value.length);
				}
				// Show first and last 2 characters
				const first = value.substring(0, 2);
				const last = value.substring(value.length - 2);
				const middle = '*'.repeat(Math.max(value.length - 4, 3));
				return `${first}${middle}${last}`;

			default:
				return '*****';
		}
	}

	/**
	 * Applies decorations to the given text editor.
	 */
	public applyDecorations(editor: vscode.TextEditor): void {
		if (!this.decorationType) {
			return;
		}

		// Check if masking is enabled
		if (!this.isEnabled()) {
			this.clearDecorations(editor);
			return;
		}

		// Check if this document should be processed (language + glob patterns)
		if (!shouldProcessDocument(editor.document)) {
			return;
		}

		const entries = parseEnvDocument(editor.document);
		const filteredEntries = filterExcludedKeys(entries, this.getExcludedKeys());
		const maskMode = this.getMaskMode();

		const decorations: vscode.DecorationOptions[] = filteredEntries
			.filter((entry) => entry.value.length > 0) // Skip empty values
			.map((entry) => this.createDecoration(entry, maskMode));

		editor.setDecorations(this.decorationType, decorations);
	}

	/**
	 * Creates a decoration option for a single entry.
	 */
	private createDecoration(
		entry: EnvEntry,
		mode: MaskMode
	): vscode.DecorationOptions {
		const range = new vscode.Range(
			entry.line,
			entry.valueStart,
			entry.line,
			entry.valueEnd
		);

		const maskText = this.generateMask(entry.value, mode);

		return {
			range,
			renderOptions: {
				after: {
					contentText: maskText,
					color: new vscode.ThemeColor('editorInfo.foreground'),
					backgroundColor: new vscode.ThemeColor('editor.selectionBackground'),
					fontStyle: 'normal',
				},
			},
		};
	}

	/**
	 * Clears all decorations from the given editor.
	 */
	public clearDecorations(editor: vscode.TextEditor): void {
		if (this.decorationType) {
			editor.setDecorations(this.decorationType, []);
		}
	}

	/**
	 * Clears decorations from all visible editors.
	 */
	public clearAllDecorations(): void {
		if (this.decorationType) {
			for (const editor of vscode.window.visibleTextEditors) {
				editor.setDecorations(this.decorationType, []);
			}
		}
	}

	/**
	 * Refreshes decorations for all visible dotenv editors.
	 */
	public refreshAllDecorations(): void {
		for (const editor of vscode.window.visibleTextEditors) {
			if (editor.document.languageId === 'dotenv') {
				this.applyDecorations(editor);
			}
		}
	}

	/**
	 * Called when configuration changes - recreates decoration type if needed.
	 */
	public onConfigurationChanged(): void {
		// Refresh decorations with new settings
		this.refreshAllDecorations();
	}

	/**
	 * Disposes all resources.
	 */
	public dispose(): void {
		if (this.decorationType) {
			this.decorationType.dispose();
			this.decorationType = undefined;
		}
		for (const disposable of this.disposables) {
			disposable.dispose();
		}
		this.disposables.length = 0;
	}
}
