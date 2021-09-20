// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

async function createNameInput() {
	var option: vscode.InputBoxOptions = {
		ignoreFocusOut: false,
		placeHolder: "foo::bar::MyClass",
		prompt: "Type in your class name here"
	};
	return vscode.window.showInputBox(option);
}

const specialsChars = /[!@#$%^&*()+\=\[\]{};'"\\|,.<>\/?]+/;

class ClassGenerator {
	_path: any = undefined;
	_hppExt: string = 'hpp';
	_cppExt: string = 'cpp';
	_useIfndef: boolean = true;
	_lowerCaseNS: boolean = true;
	_snakeCaseFileName: boolean = true;
	_namespaces: string[] = [];
	_className: any = undefined;
	_cppName: any = undefined;
	_hppName: any = undefined;

	constructor() {
		this.getConfiguration();
	}

	init(args: any) {
		if (args)
			this._path = args.path;
		else
			this.getCurrentWSPath();


		return (this._path !== undefined);
	}

	private getConfiguration() {
		this._cppExt = vscode.workspace.getConfiguration().get("cpp.betterclasses.cppExtension") as string;
		this._hppExt = vscode.workspace.getConfiguration().get("cpp.betterclasses.hppExtension") as string;
		this._useIfndef = vscode.workspace.getConfiguration().get("cpp.betterclasses.useIfndef") as boolean;
		this._lowerCaseNS = vscode.workspace.getConfiguration().get("cpp.betterclasses.lowerCaseNamespace") as boolean;
		this._snakeCaseFileName = vscode.workspace.getConfiguration().get("cpp.betterclasses.snakeCaseFilename") as boolean;
	}

	async createClass() {
		this._className = await createNameInput();

		if (!this.checkClassName())
			return;

		if (!this.extractNamespaces())
			return;

		this.generateFilenames();

		if (this.createSourceFile() && this.createHeaderFile())
			vscode.window.showInformationMessage('class ' + this._className + '  has been created!');
	}

	async createClassTemplate() {
		this._className = await createNameInput();

		if (!this.checkClassName())
			return;

		if (!this.extractNamespaces())
			return;

		this.generateFilenames();

		if (this.createTemplateHeaderFile())
			vscode.window.showInformationMessage('class ' + this._className + '  has been created!');
	}

	private generateFilenames() {
		let baseName: string = this._className;

		if (this._snakeCaseFileName)
			baseName = baseName.split(/(?=[A-Z])/).join('_').toLowerCase();

		this._hppName = [baseName, this._hppExt].join('.');
		this._cppName = [baseName, this._cppExt].join('.');
	}

	private createTemplateHeaderFile() {
		let result: boolean = true;
		let buffer: string = '';
		let ifndef: string = '';

		if (this._useIfndef) {
			let tokens: string[] = Object.assign([], this._namespaces);

			tokens.push(this._className, 'h');
			ifndef = tokens.join('_').toUpperCase();

			buffer += `#ifndef ${ifndef}
#define ${ifndef}

`;
		} else
			buffer += `#pragma once
			
`;
		buffer += this.namespaceBegin();
		buffer += `template <typename T>
class ${this._className} {
 public:
	${this._className}();

 private:
};
`;
		buffer += this.namespaceEnd();

		if (this._useIfndef)
			buffer += `
#endif  // ${ifndef}
`;

		const fullPath = path.join(this._path, this._hppName);

		fs.writeFile(fullPath, buffer, function (err) {
			if (err) {
				console.error(err);
				result = false;
			}
		});
		return result;
	}


	private createHeaderFile() {
		let result: boolean = true;
		let buffer: string = '';
		let ifndef: string = '';

		if (this._useIfndef) {
			let tokens: string[] = Object.assign([], this._namespaces);

			tokens.push(this._className, 'h');
			ifndef = tokens.join('_').toUpperCase();

			buffer += `#ifndef ${ifndef}
#define ${ifndef}

`;
		} else
			buffer += `#pragma once
			
`;
		buffer += this.namespaceBegin();
		buffer += `class ${this._className} {
 public:
	${this._className}();

 private:
};
`;
		buffer += this.namespaceEnd();

		if (this._useIfndef)
			buffer += `
#endif  // ${ifndef}
`;

		const fullPath = path.join(this._path, this._hppName);

		fs.writeFile(fullPath, buffer, function (err) {
			if (err) {
				console.error(err);
				result = false;
			}
		});
		return result;
	}

	private createSourceFile() {
		let result: boolean = true;
		let buffer = `#include "${this._hppName}"

`;

		buffer += this.namespaceBegin();
		buffer += `${this._className}::${this._className} () {}
`;
		buffer += this.namespaceEnd();

		const fullPath = path.join(this._path, this._cppName);

		fs.writeFile(fullPath, buffer, function (err) {
			if (err) {
				console.error(err);
				result = false;
			}
		});

		return result;
	}

	private namespaceBegin() {
		let ns_string: string = '';
		if (this._namespaces.length !== 0)
			ns_string = `namespace ${this._namespaces.join('::')} {

`;
		return ns_string;
	}

	private namespaceEnd() {
		let ns_string: string = '';
		if (this._namespaces.length !== 0)
			ns_string = `
} // namespace ${this._namespaces.join('::')}
`;
		return ns_string;
	}

	private checkForSpecialChars() {
		return specialsChars.test(this._className);
	}

	private extractNamespaces() {
		let result: boolean = true;

		if (!this._className.includes("::"))
			return result;

		this._namespaces = this._className.split("::");

		if (this._namespaces.length < 2) {
			vscode.window.showErrorMessage("Bad Class " + this._className + "name!");
			result = false;
		}
		else {
			this._className = this._namespaces.pop();
			if (this._lowerCaseNS)
				this._namespaces.forEach((e, idx) => { this._namespaces[idx] = e.toLowerCase(); });
		}

		return result;
	}


	private checkClassName() {
		let result: boolean = false;

		if (!this._className)
			vscode.window.showErrorMessage("Class could not be created!");
		else if (this._className.indexOf(' ') >= 0)
			vscode.window.showErrorMessage("Class name should not have spaces!");
		else if (this.checkForSpecialChars())
			vscode.window.showErrorMessage("Class name should not have special characters!");
		else
			result = true;

		return result;
	}

	private getCurrentWSPath() {
		const filePath = vscode.window.activeTextEditor?.document.uri.fsPath;

		if (filePath !== undefined) {
			this._path = path.dirname(filePath);
			return;
		}

		if (vscode.workspace.workspaceFolders !== undefined)
			this._path = vscode.workspace.workspaceFolders[0].uri.path;
	}
}

export function activate(context: vscode.ExtensionContext) {
	let cls_generator = new ClassGenerator();

	let cmdNewClass = vscode.commands.registerCommand('cpp-better-classes.newClass', async (args) => {

		if (cls_generator.init(args))
			await cls_generator.createClass()
		else
			vscode.window.showErrorMessage('Open Workspace First!');

	});

	let cmdNewClassTemplate = vscode.commands.registerCommand('cpp-better-classes.newClassTemplate', async (args) => {

		if (cls_generator.init(args))
			await cls_generator.createClassTemplate()
		else
			vscode.window.showErrorMessage('Open Workspace First!');

	});

	context.subscriptions.push(cmdNewClassTemplate, cmdNewClass);
}

export function deactivate() { }
