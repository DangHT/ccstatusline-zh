import type { RenderContext } from '../types/RenderContext';
import type { Settings } from '../types/Settings';
import type {
    CustomKeybind,
    Widget,
    WidgetEditorDisplay,
    WidgetItem
} from '../types/Widget';
import {
    getJjChangeCounts,
    isInsideJjRepo
} from '../utils/jj';

export class JjDeletionsWidget implements Widget {
    getDefaultColor(): string { return 'red'; }
    getDescription(): string { return '显示 Jujutsu 删除行数'; }
    getDisplayName(): string { return 'JJ 删除行数'; }
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
            return '-10';
        }

        if (!isInsideJjRepo(context)) {
            return hideNoJj ? null : '(无 JJ)';
        }

        const changes = getJjChangeCounts(context);
        return `-${changes.deletions}`;
    }

    getCustomKeybinds(): CustomKeybind[] {
        return [
            { key: 'h', label: '(h)隐藏「无 JJ」提示', action: 'toggle-nojj' }
        ];
    }

    supportsRawValue(): boolean { return false; }
    supportsColors(item: WidgetItem): boolean { return true; }
}
