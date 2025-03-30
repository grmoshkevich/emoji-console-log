import * as vscode from 'vscode';

// List of emojis to choose from
const EMOJIS = ['😀', '😂', '😊', '😎', '🤔', '👍', '✨', '🚀', '🐞', '👀', '🐘', '✅', '❌', '⚠️', '➡️', '💡', '🔧', '🪵', '🌲', '🧊', '�', '💧', '🌍'];

// Keep track of the next emoji index to use
let currentEmojiIndex = -1;

// Function to pick the next emoji sequentially
function getNextEmoji(): string {
    currentEmojiIndex = (currentEmojiIndex + 1) % EMOJIS.length; // Increment and wrap around
    return EMOJIS[currentEmojiIndex];
}

// Helper to get indentation of a line
function getIndent(document: vscode.TextDocument, lineNumber: number): string {
	const line = document.lineAt(lineNumber);
	return line.text.substring(0, line.firstNonWhitespaceCharacterIndex >= 0 ? line.firstNonWhitespaceCharacterIndex : 0);
}

// This method is called when your extension is activated
export function activate(context: vscode.ExtensionContext) {

	console.log('Congratulations, your extension "console-log-emoji" is now active!');

	// Register the command
	const disposable = vscode.commands.registerCommand('console-log-emoji.log', () => {
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			vscode.window.showInformationMessage("No active editor found.");
			return; // Exit if no editor is open
		}

		const document = editor.document;
		const selection = editor.selection;
		const nextEmoji = getNextEmoji();

		let textToLog: string | null = null;
		let targetLineNumber: number;

		// Determine what to log and where
		if (!selection.isEmpty) {
			const selectedText = document.getText(selection).trim();
			if (selectedText) {
				textToLog = selectedText;
				targetLineNumber = selection.end.line;
			} else {
				// Selection was only whitespace, treat as no selection/cursor position
				targetLineNumber = selection.active.line;
			}
		} else {
			// No selection, check for word under cursor
			const cursorPosition = selection.active;
			targetLineNumber = cursorPosition.line;
			const wordRange = document.getWordRangeAtPosition(cursorPosition);
			if (wordRange) {
				textToLog = document.getText(wordRange);
			}
		}

		// Determine insertion point and indentation
		const targetLine = document.lineAt(targetLineNumber);
		const insertPosition = targetLine.range.end;

		// Calculate indentation based on current and next line
		const currentIndent = getIndent(document, targetLineNumber); // Use helper
		let finalIndent = currentIndent;
		const nextLineNumber = targetLineNumber + 1;
		if (nextLineNumber < document.lineCount) {
			const nextIndent = getIndent(document, nextLineNumber);
			if (nextIndent.length > currentIndent.length) {
				finalIndent = nextIndent;
			}
		}

		// Construct the log statement
		const logStatement = textToLog
			? `console.log('${nextEmoji}', ${textToLog});`
			: `console.log('${nextEmoji}');`;

		// Apply the edit and move cursor
		editor.edit(editBuilder => {
			editBuilder.insert(insertPosition, `\n${finalIndent}${logStatement}`);
		}).then(success => {
			if (success) {
				// Move cursor to just before the closing parenthesis
				const newPositionLine = insertPosition.line + 1;
				const newPositionChar = finalIndent.length + logStatement.length - 2; // Use finalIndent
				const newPosition = new vscode.Position(newPositionLine, newPositionChar);
				editor.selection = new vscode.Selection(newPosition, newPosition);
			}
		});
	});

	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}