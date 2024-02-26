import * as vscode from 'vscode';

export class DiffViewAgent {
    static async handleResponse(userChoice: string, data: any, messageId: string) {
        const chip = data.chip;
        const optimizedCode = data.optimizedCode;
        const originalCodeUri = data.originalCodeUri;
        const editorUri = chip.referenceData.editor;
        const document = vscode.workspace.textDocuments.find(function (e) {
            console.log(e.uri.toString(), editorUri);
            return e.uri.toString() === editorUri;
        });

        const selection = chip.referenceData.selection;
        const range: vscode.Range = new vscode.Range(new vscode.Position(selection.start.line, selection.start.character), new vscode.Position(selection.end.line, selection.end.character));
        if (!document) {
            return;
        }
        if (userChoice === 'accept') {

            vscode.commands.executeCommand('workbench.action.closeActiveEditor'); // assuming apply edit time will be enough for the diff to close so user doesn't see a jank.
            // Apply the optimized code
            const workspaceEdit = new vscode.WorkspaceEdit();
            const entireDocumentRange = new vscode.Range(
                document.positionAt(0),
                document.positionAt(document.getText().length)
            );
            workspaceEdit.replace(originalCodeUri, entireDocumentRange, optimizedCode);
            if (await vscode.workspace.applyEdit(workspaceEdit)) {
                let openDocument = await vscode.workspace.openTextDocument(document.uri);
                await vscode.window.showTextDocument(openDocument, {
                    viewColumn: range.start.character,
                    preserveFocus: false,
                    selection: range,
                });
            }
        } else {
            await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
            let openDocument = await vscode.workspace.openTextDocument(document.uri);
            await vscode.window.showTextDocument(openDocument, {
                viewColumn: range.start.character,
                preserveFocus: false,
                selection: range,
            });
        }
        return { role: "dash", parts: 'Code refactored successfully!', messageId: messageId, data: {}, buttons: [], agent: "messageView" };
    }
}