import * as fs from 'fs';
import * as path from 'path';

import type { RenderContext } from '../types/RenderContext';
import type { Settings } from '../types/Settings';
import type {
    Widget,
    WidgetEditorDisplay,
    WidgetItem
} from '../types/Widget';
import { getClaudeConfigDir } from '../utils/claude-settings';

interface ClaudeJson { oauthAccount?: { emailAddress?: string } }

export class ClaudeAccountEmailWidget implements Widget {
    getDefaultColor(): string { return 'blue'; }
    getDescription(): string { return '显示当前已登录的 Claude 账户邮箱'; }
    getDisplayName(): string { return 'Claude 账户邮箱'; }
    getCategory(): string { return '会话'; }
    getEditorDisplay(item: WidgetItem): WidgetEditorDisplay {
        return { displayText: this.getDisplayName() };
    }

    render(item: WidgetItem, context: RenderContext, settings: Settings): string | null {
        if (context.isPreview) {
            return item.rawValue ? 'you@example.com' : '账户: you@example.com';
        }

        try {
            const configDir = getClaudeConfigDir();
            const claudeJsonPath = path.join(configDir, '..', '.claude.json');
            const resolved = path.resolve(claudeJsonPath);

            if (!fs.existsSync(resolved)) {
                return null;
            }

            const content = fs.readFileSync(resolved, 'utf-8');
            const data = JSON.parse(content) as ClaudeJson;
            const email = data.oauthAccount?.emailAddress;

            if (!email) {
                return null;
            }

            return item.rawValue ? email : `账户: ${email}`;
        } catch {
            return null;
        }
    }

    supportsRawValue(): boolean { return true; }
    supportsColors(item: WidgetItem): boolean { return true; }
}