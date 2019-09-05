import * as vscode from 'vscode';
import { DOMParser, XMLSerializer } from 'xmldom';

export function activate(context: vscode.ExtensionContext) {
	let disposable = vscode.commands.registerCommand('extension.specifichtmlpreviewer', () => {
		const activeEditor = vscode.window.activeTextEditor;

		if (!activeEditor) {
			vscode.window.showErrorMessage('Not current file');
			return false;
		}

		if (activeEditor.document.languageId !== 'html') {
			vscode.window.showErrorMessage('Not a HTML file');
			return false;
		}

		const panel = vscode.window.createWebviewPanel('specifichtmlpreviewer', 'Preview', 2, {
			enableScripts: true,
		});

		// get the current specific tag html
		const currentLine = activeEditor.selection.active.line;

		// getting html
		const html = activeEditor.document.getText();
		const htmlSplitted = html.split('\n');
		const currentLineContent = htmlSplitted[currentLine];

		// check if there's already an id in the current line
		const idRegex = /id="(.*?)"/;
		const idMatches = idRegex.exec(currentLineContent);
		let id;
		if (idMatches !== null) {
			id = idMatches[1];
		} else {
			id = 'specifichtmlpreviewer-' + (Math.floor(Math.random() * 10000)).toString();
			htmlSplitted[currentLine] = currentLineContent.replace(/<([a-zA-Z]*) /, '<$1 id="' + id + '"');
		}

		const newHtml = htmlSplitted.join('\n');
		var parser = new DOMParser();
		const dom = parser.parseFromString(newHtml);
		const element = dom.getElementById(id);
		if (element === null) {
			vscode.window.showErrorMessage('Error: can not find the current element');
			return false;
		}

		panel.webview.html = new XMLSerializer().serializeToString(element);
	});
	context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}
