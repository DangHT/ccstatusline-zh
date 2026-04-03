import {
    describe,
    expect,
    it
} from 'vitest';

import {
    DEFAULT_SETTINGS,
    type Settings
} from '../../types/Settings';
import type { WidgetItemType } from '../../types/Widget';
import {
    filterWidgetCatalog,
    getAllWidgetTypes,
    getWidget,
    getWidgetCatalog,
    getWidgetCatalogCategories,
    isKnownWidgetType,
    type WidgetCatalogEntry
} from '../widgets';

describe('widget catalog', () => {
    const baseSettings: Settings = {
        ...DEFAULT_SETTINGS,
        powerline: { ...DEFAULT_SETTINGS.powerline }
    };

    it('builds catalog entries with categories from widget definitions', () => {
        const catalog = getWidgetCatalog(baseSettings);

        const model = catalog.find(entry => entry.type === 'model');
        const separator = catalog.find(entry => entry.type === 'separator');
        const link = catalog.find(entry => entry.type === 'link');
        const gitInsertions = catalog.find(entry => entry.type === 'git-insertions');
        const gitDeletions = catalog.find(entry => entry.type === 'git-deletions');
        const inputSpeed = catalog.find(entry => entry.type === 'input-speed');
        const outputSpeed = catalog.find(entry => entry.type === 'output-speed');
        const totalSpeed = catalog.find(entry => entry.type === 'total-speed');
        const resetTimer = catalog.find(entry => entry.type === 'reset-timer');
        const weeklyResetTimer = catalog.find(entry => entry.type === 'weekly-reset-timer');

        expect(model?.displayName).toBe('模型');
        expect(model?.category).toBe('核心');
        expect(separator?.displayName).toBe('分隔符');
        expect(separator?.category).toBe('布局');
        expect(link?.displayName).toBe('链接');
        expect(link?.category).toBe('自定义');
        expect(gitInsertions?.displayName).toBe('Git 新增');
        expect(gitInsertions?.category).toBe('Git');
        expect(gitDeletions?.displayName).toBe('Git 删除');
        expect(gitDeletions?.category).toBe('Git');
        expect(inputSpeed?.displayName).toBe('输入速度');
        expect(inputSpeed?.category).toBe('Token 速度');
        expect(outputSpeed?.displayName).toBe('输出速度');
        expect(outputSpeed?.category).toBe('Token 速度');
        expect(totalSpeed?.displayName).toBe('总速度');
        expect(totalSpeed?.category).toBe('Token 速度');
        expect(resetTimer?.displayName).toBe('时段重置计时');
        expect(resetTimer?.category).toBe('用量');
        expect(weeklyResetTimer?.displayName).toBe('周重置计时');
        expect(weeklyResetTimer?.category).toBe('用量');
    });

    it('hides manual separator when default separator is configured', () => {
        const catalog = getWidgetCatalog({
            ...baseSettings,
            defaultSeparator: '|'
        });

        const types = new Set(catalog.map(entry => entry.type));
        expect(types.has('separator')).toBe(false);
        expect(types.has('flex-separator')).toBe(true);
    });

    it('hides both separator types in powerline mode', () => {
        const catalog = getWidgetCatalog({
            ...baseSettings,
            powerline: {
                ...baseSettings.powerline,
                enabled: true
            }
        });

        const types = new Set(catalog.map(entry => entry.type));
        expect(types.has('separator')).toBe(false);
        expect(types.has('flex-separator')).toBe(false);
    });

    it('returns unique categories in discovery order', () => {
        const categories = getWidgetCatalogCategories(getWidgetCatalog(baseSettings));

        expect(categories).toContain('核心');
        expect(categories).toContain('Git');
        expect(categories).toContain('上下文');
        expect(categories).toContain('Token');
        expect(categories).toContain('Token 速度');
        expect(categories).toContain('会话');
        expect(categories).toContain('用量');
        expect(categories).toContain('环境');
        expect(categories).toContain('自定义');
        expect(categories).toContain('布局');
    });

    it('returns runtime widget instances for non-layout widget types', () => {
        const runtimeTypes = getAllWidgetTypes(baseSettings).filter(
            type => type !== 'separator' && type !== 'flex-separator'
        );

        for (const type of runtimeTypes) {
            const widget = getWidget(type);
            expect(widget).not.toBeNull();
            expect(widget?.getDisplayName().length).toBeGreaterThan(0);
        }
    });

    it('recognizes known widget and layout types', () => {
        expect(isKnownWidgetType('model')).toBe(true);
        expect(isKnownWidgetType('separator')).toBe(true);
        expect(isKnownWidgetType('flex-separator')).toBe(true);
        expect(isKnownWidgetType('unknown-widget-type')).toBe(false);
    });
});

describe('widget catalog filtering', () => {
    const catalog = getWidgetCatalog({
        ...DEFAULT_SETTINGS,
        powerline: { ...DEFAULT_SETTINGS.powerline }
    });

    it('matches display name with case-insensitive partial search', () => {
        const results = filterWidgetCatalog(catalog, '全部', 'Git 分');
        expect(results[0]?.type).toBe('git-branch');
    });

    it('matches type string search such as git-worktree', () => {
        const results = filterWidgetCatalog(catalog, '全部', 'git-worktree');
        expect(results[0]?.type).toBe('git-worktree');
    });

    it('matches description search', () => {
        const results = filterWidgetCatalog(catalog, '全部', '工作目录');
        expect(results.some(entry => entry.type === 'current-working-dir')).toBe(true);
    });

    it('applies category and query filters together', () => {
        const results = filterWidgetCatalog(catalog, 'Git', 'context');
        expect(results).toHaveLength(0);
    });

    it('prioritizes name match before type and description matches', () => {
        const rankingCatalog: WidgetCatalogEntry[] = [
            {
                type: 'alpha' as WidgetItemType,
                displayName: 'Git 分支',
                description: 'Primary match',
                category: '核心',
                searchText: 'git branch primary match alpha'
            },
            {
                type: 'git-type-only' as WidgetItemType,
                displayName: 'Branch',
                description: 'Type fallback match',
                category: '核心',
                searchText: 'branch type fallback match git-type-only'
            },
            {
                type: 'desc-only' as WidgetItemType,
                displayName: 'Branch',
                description: 'Description contains git',
                category: '核心',
                searchText: 'branch description contains git desc-only'
            }
        ];

        const results = filterWidgetCatalog(rankingCatalog, '全部', 'git');
        expect(results.map(entry => entry.type)).toEqual(['alpha', 'git-type-only', 'desc-only']);
    });
});