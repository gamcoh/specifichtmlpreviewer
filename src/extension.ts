import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
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
		let element = dom.getElementById(id);
		if (element === null) {
			vscode.window.showErrorMessage('Error: can not find the current element');
			return false;
		}

		const xmlSerializer = new XMLSerializer();
		let finalHtml = xmlSerializer.serializeToString(element);

		// take the styles of the file
		const styles = dom.getElementsByTagName('style');
		if (styles !== null) {
			for (let index = 0; index < styles.length; index++) {
				finalHtml += xmlSerializer.serializeToString(styles[index]);
			}
		}

		// take the external styles of the files
		const cssLinks = dom.getElementsByTagName('link');
		if (cssLinks !== null) {
			for (let index = 0; index < cssLinks.length; index++) {
				const link = cssLinks[index];
				const href = link.getAttribute('href');

				if (href === null || !href.endsWith('.css')) {
					continue;
				}

				const filepath = path.join(path.dirname(activeEditor.document.fileName), href);
				const filecontent = fs.readFileSync(filepath);
				if (!filecontent) {
					continue;
				}

				finalHtml += `<style>${filecontent}</style>`;
			}
		}

		panel.webview.html = finalHtml;
	});
	context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}
