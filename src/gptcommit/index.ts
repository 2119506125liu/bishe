/*
 * This code includes portions of code from the aicommits project, which is
 * licensed under the MIT License. Copyright (c) Hassan El Mghari.
 * The original code can be found at https://github.com/Nutlope/aicommits/blob/develop/src/commands/aicommits.ts
 */

import * as vscode from 'vscode';

import { assertGitRepo, getStagedDiff } from "./utils/git";
import { generateCommitMessage } from './utils/openai';
import { runTaskWithTimeout } from './utils/timer';

async function generateAICommitMessage(apiKey: string) {
    const assertResult = await assertGitRepo();

    if (!assertResult) {
        vscode.window.showErrorMessage('The current directory must be a Git repository!');
        return;
    }

    const staged = await getStagedDiff();

    if (!staged) {
        vscode.window.showErrorMessage('No staged changes found. Make sure to stage your changes with `git add`.');
        return;
    }

    const commitMessage = await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        cancellable: false,
        title: 'Generating AI Commit message',
    }, async (progress) => {
        let increment = 0;

        runTaskWithTimeout(() => {
            progress.report({ increment: increment += 1 });
        }, 5000, 200);

        const commitMessage = await generateCommitMessage(
            apiKey,
            staged.diff,
        );

        return commitMessage;
    });

    if (!commitMessage) {
        vscode.window.showErrorMessage('No commit message were generated. Try again.');
        return;
    }

    const result = await vscode.window.showQuickPick(['Yes', 'No'], {
        title: `Use this commit message?: ${commitMessage}`,
    });

    if (result !== 'Yes') {
        return;
    }

    return commitMessage;
};

export default generateAICommitMessage;
