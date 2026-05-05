import type { RenderContext } from '../types/RenderContext';
import type { Settings } from '../types/Settings';
import type {
    CustomKeybind,
    Widget,
    WidgetEditorDisplay,
    WidgetItem
} from '../types/Widget';
import {
    isInsideJjRepo,
    runJjArgs
} from '../utils/jj';

const CURRENT_WORKSPACE_TEMPLATE = 'if(target.current_working_copy(), name ++ "\n")';

export class JjWorkspaceWidget implements Widget {
    getDefaultColor(): string { return 'blue'; }
    getDescription(): string { return '显示当前 Jujutsu 工作区名'; }
    getDisplayName(): string { return 'JJ 工作区'; }
    getCategory(): string { return 'Jujutsu'; }
    getEditorDisplay(item: WidgetItem): WidgetEditorDisplay {
        const hideNoJj = item.metadata?.hideNoJj === 'true';
        const modifiers: string[] = [];

        if (hideNoJj) {
            modifiers.push('隐藏「无 JJ」');
        }

        return {
            displayText: this.getDisplayName(),
            modifierText: modifiers.length > 0 ? `(${modifiers.join(', ')})` : undefined
        };
    }

    handleEditorAction(action: string, item: WidgetItem): WidgetItem | null {
        if (action === 'toggle-nojj') {
            const currentState = item.metadata?.hideNoJj === 'true';
            return {
                ...item,
                metadata: {
                    ...item.metadata,
                    hideNoJj: (!currentState).toString()
                }
            };
        }
        return null;
    }

    render(item: WidgetItem, context: RenderContext, _settings: Settings): string | null {
        const hideNoJj = item.metadata?.hideNoJj === 'true';

        if (context.isPreview) {
            return item.rawValue ? 'default' : '◆ default';
        }

        if (!isInsideJjRepo(context)) {
            return hideNoJj ? null : '◆ 无 JJ';
        }

        const workspace = this.getJjWorkspace(context);
        if (workspace) {
            return item.rawValue ? workspace : `◆ ${workspace}`;
        }

        return hideNoJj ? null : '◆ 无 JJ';
    }

    private getJjWorkspace(context: RenderContext): string | null {
        const output = runJjArgs([
            'workspace',
            'list',
            '--template',
            CURRENT_WORKSPACE_TEMPLATE
        ], context);
        if (!output) {
            return null;
        }

        return output.split(/\r?\n/).map(workspace => workspace.trim()).find(Boolean) ?? null;
    }

    getCustomKeybinds(): CustomKeybind[] {
        return [
            { key: 'h', label: '(h)隐藏「无 JJ」提示', action: 'toggle-nojj' }
        ];
    }

    supportsRawValue(): boolean { return true; }
    supportsColors(): boolean { return true; }
}
