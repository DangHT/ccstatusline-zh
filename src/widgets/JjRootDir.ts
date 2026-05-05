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

export class JjRootDirWidget implements Widget {
    getDefaultColor(): string { return 'cyan'; }
    getDescription(): string { return '显示 Jujutsu 仓库根目录名'; }
    getDisplayName(): string { return 'JJ 根目录'; }
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
            return 'my-repo';
        }

        if (!isInsideJjRepo(context)) {
            return hideNoJj ? null : '无 JJ';
        }

        const rootDir = runJjArgs(['root'], context);
        if (rootDir) {
            return this.getRootDirName(rootDir);
        }

        return hideNoJj ? null : '无 JJ';
    }

    private getRootDirName(rootDir: string): string {
        const trimmedRootDir = rootDir.replace(/[\\/]+$/, '');
        const normalizedRootDir = trimmedRootDir.length > 0 ? trimmedRootDir : rootDir;
        const parts = normalizedRootDir.split(/[\\/]/).filter(Boolean);
        const lastPart = parts[parts.length - 1];
        return lastPart && lastPart.length > 0 ? lastPart : normalizedRootDir;
    }

    getCustomKeybinds(): CustomKeybind[] {
        return [
            { key: 'h', label: '(h)隐藏「无 JJ」提示', action: 'toggle-nojj' }
        ];
    }

    supportsRawValue(): boolean { return false; }
    supportsColors(): boolean { return true; }
}
