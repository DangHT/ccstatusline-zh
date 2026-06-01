import type { RenderContext } from '../types/RenderContext';
import type { Settings } from '../types/Settings';
import type {
    Widget,
    WidgetEditorDisplay,
    WidgetItem
} from '../types/Widget';

import { formatRawOrLabeledValue } from './shared/raw-or-labeled';

export class RequestCountWidget implements Widget {
    getDefaultColor(): string { return 'magenta'; }
    getDescription(): string { return '显示当前会话已发起的请求数（assistant usage 条目数，含子代理）'; }
    getDisplayName(): string { return '请求数'; }
    getCategory(): string { return '会话'; }
    getEditorDisplay(item: WidgetItem): WidgetEditorDisplay {
        return { displayText: this.getDisplayName() };
    }

    render(item: WidgetItem, context: RenderContext, settings: Settings): string | null {
        if (context.isPreview) {
            return formatRawOrLabeledValue(item, '请求: ', '42');
        }

        if (context.speedMetrics) {
            return formatRawOrLabeledValue(item, '请求: ', context.speedMetrics.requestCount.toString());
        }
        return null;
    }

    supportsRawValue(): boolean { return true; }
    supportsColors(item: WidgetItem): boolean { return true; }
}
