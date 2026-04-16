import type { RenderContext } from '../types/RenderContext';
import type { Settings } from '../types/Settings';
import type {
    CustomKeybind,
    Widget,
    WidgetEditorDisplay,
    WidgetItem
} from '../types/Widget';
import type { PrData } from '../utils/gh-pr-cache';
import {
    fetchPrData,
    getPrStatusLabel,
    truncateTitle
} from '../utils/gh-pr-cache';
import {
    isInsideGitWorkTree,
    resolveGitCwd
} from '../utils/git';
import { renderOsc8Link } from '../utils/hyperlink';

import { makeModifierText } from './shared/editor-display';
import {
    getHideNoGitKeybinds,
    getHideNoGitModifierText,
    handleToggleNoGitAction,
    isHideNoGitEnabled
} from './shared/git-no-git';
import {
    isMetadataFlagEnabled,
    toggleMetadataFlag
} from './shared/metadata';

const HIDE_STATUS_KEY = 'hideStatus';
const HIDE_TITLE_KEY = 'hideTitle';
const TOGGLE_STATUS_ACTION = 'toggle-status';
const TOGGLE_TITLE_ACTION = 'toggle-title';

export interface GitPrWidgetDeps {
    fetchPrData: typeof fetchPrData;
    getProcessCwd: typeof process.cwd;
    isInsideGitWorkTree: typeof isInsideGitWorkTree;
    resolveGitCwd: typeof resolveGitCwd;
}

const DEFAULT_GIT_PR_WIDGET_DEPS: GitPrWidgetDeps = {
    fetchPrData,
    getProcessCwd: () => process.cwd(),
    isInsideGitWorkTree,
    resolveGitCwd
};

const PREVIEW_PR: PrData = {
    number: 42,
    url: 'https://github.com/owner/repo/pull/42',
    title: '示例 PR 标题',
    state: 'OPEN',
    reviewDecision: ''
};

function buildDisplay(
    item: WidgetItem,
    pr: PrData,
    showStatus: boolean,
    showTitle: boolean
): string {
    const linkText = item.rawValue ? `#${pr.number}` : `PR #${pr.number}`;
    const parts: string[] = [renderOsc8Link(pr.url, linkText)];

    if (showStatus) {
        const status = getPrStatusLabel(pr.state, pr.reviewDecision);
        if (status.length > 0) {
            parts.push(status);
        }
    }

    if (showTitle && pr.title.length > 0) {
        parts.push(truncateTitle(pr.title));
    }

    return parts.join(' ');
}

export class GitPrWidget implements Widget {
    constructor(private readonly deps: GitPrWidgetDeps = DEFAULT_GIT_PR_WIDGET_DEPS) {}

    getDefaultColor(): string { return 'cyan'; }
    getDescription(): string { return '显示当前分支的 PR 信息（可点击链接、状态、标题）'; }
    getDisplayName(): string { return 'Git PR'; }
    getCategory(): string { return 'Git'; }

    getEditorDisplay(item: WidgetItem): WidgetEditorDisplay {
        const modifiers: string[] = [];
        const noGitText = getHideNoGitModifierText(item);
        if (noGitText)
            modifiers.push('隐藏「无 Git」');
        if (isMetadataFlagEnabled(item, HIDE_STATUS_KEY))
            modifiers.push('无状态');
        if (isMetadataFlagEnabled(item, HIDE_TITLE_KEY))
            modifiers.push('无标题');
        return {
            displayText: this.getDisplayName(),
            modifierText: makeModifierText(modifiers)
        };
    }

    handleEditorAction(action: string, item: WidgetItem): WidgetItem | null {
        if (action === TOGGLE_STATUS_ACTION) {
            return toggleMetadataFlag(item, HIDE_STATUS_KEY);
        }
        if (action === TOGGLE_TITLE_ACTION) {
            return toggleMetadataFlag(item, HIDE_TITLE_KEY);
        }
        return handleToggleNoGitAction(action, item);
    }

    render(item: WidgetItem, context: RenderContext, settings: Settings): string | null {
        void settings;
        const hideNoGit = isHideNoGitEnabled(item);
        const showStatus = !isMetadataFlagEnabled(item, HIDE_STATUS_KEY);
        const showTitle = !isMetadataFlagEnabled(item, HIDE_TITLE_KEY);

        if (context.isPreview) {
            return buildDisplay(item, PREVIEW_PR, showStatus, showTitle);
        }

        if (!this.deps.isInsideGitWorkTree(context)) {
            return hideNoGit ? null : '（无 PR）';
        }

        const cwd = this.deps.resolveGitCwd(context) ?? this.deps.getProcessCwd();
        const prData = this.deps.fetchPrData(cwd);
        if (!prData) {
            return hideNoGit ? null : '（无 PR）';
        }

        return buildDisplay(item, prData, showStatus, showTitle);
    }

    getCustomKeybinds(): CustomKeybind[] {
        return [
            ...getHideNoGitKeybinds(),
            { key: 's', label: '(s)状态', action: TOGGLE_STATUS_ACTION },
            { key: 't', label: '(t)标题', action: TOGGLE_TITLE_ACTION }
        ];
    }

    supportsRawValue(): boolean { return true; }
    supportsColors(item: WidgetItem): boolean { return true; }
}