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

export class JjBookmarksWidget implements Widget {
    getDefaultColor(): string { return 'magenta'; }
    getDescription(): string { return '显示当前的 Jujutsu 书签'; }
    getDisplayName(): string { return 'JJ 书签'; }
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
            return item.rawValue ? 'main' : '🔖 main';
        }

        if (!isInsideJjRepo(context)) {
            return hideNoJj ? null : '🔖 无 JJ';
        }

        const bookmarks = this.getJjBookmarks(context);
        if (bookmarks) {
            return item.rawValue ? bookmarks : `🔖 ${bookmarks}`;
        }

        return hideNoJj ? null : '🔖 (none)';
    }

    private getJjBookmarks(context: RenderContext): string | null {
        const output = runJjArgs([
            'log',
            '--no-graph',
            '-r',
            'heads(::@ & bookmarks())',
            '--template',
            'bookmarks'
        ], context);
        if (!output) {
            return null;
        }

        const bookmarks = output.split(/\s+/).filter(Boolean);
        if (bookmarks.length === 0) {
            return null;
        }

        return bookmarks.join(', ');
    }

    getCustomKeybinds(): CustomKeybind[] {
        return [
            { key: 'h', label: '(h)隐藏「无 JJ」提示', action: 'toggle-nojj' }
        ];
    }

    supportsRawValue(): boolean { return true; }
    supportsColors(): boolean { return true; }
}
