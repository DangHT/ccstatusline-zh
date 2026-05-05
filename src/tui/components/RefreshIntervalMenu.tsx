import {
    Box,
    Text,
    useInput
} from 'ink';
import React, { useState } from 'react';

import { shouldInsertInput } from '../../utils/input-guards';

import {
    List,
    type ListEntry
} from './List';

type ConfigureStatusLineValue = 'refreshInterval';

function getRefreshInputValue(interval: number | null): string {
    return interval === null ? '' : String(interval);
}

function getRefreshIntervalSublabel(interval: number | null, supported: boolean): string {
    if (!supported) {
        return '（需要 Claude Code ≥ 2.1.97）';
    }

    if (interval === null) {
        return '（未设置）';
    }

    return `（${interval} 秒）`;
}

export function buildConfigureStatusLineItems(
    refreshInterval: number | null,
    supportsRefreshInterval: boolean
): ListEntry<ConfigureStatusLineValue>[] {
    return [
        {
            label: '🔄 刷新间隔',
            sublabel: getRefreshIntervalSublabel(refreshInterval, supportsRefreshInterval),
            value: 'refreshInterval',
            disabled: !supportsRefreshInterval,
            description: supportsRefreshInterval
                ? 'Claude Code 重新运行状态栏命令的频率。输入秒数 (1-60)，留空即移除。'
                : '本设置需要 Claude Code 2.1.97 或更高版本。请升级 Claude Code 后再使用。'
        }
    ];
}

export function validateRefreshIntervalInput(value: string): string | null {
    if (value === '') {
        return null;
    }

    const parsed = parseInt(value, 10);

    if (isNaN(parsed)) {
        return '请输入有效数字';
    }

    if (parsed < 1) {
        return `最小间隔为 1 秒（输入了 ${parsed} 秒）`;
    }

    if (parsed > 60) {
        return `最大间隔为 60 秒（输入了 ${parsed} 秒）`;
    }

    return null;
}

export interface RefreshIntervalMenuProps {
    currentInterval: number | null;
    supportsRefreshInterval: boolean;
    onUpdate: (interval: number | null) => void;
    onBack: () => void;
}

export const RefreshIntervalMenu: React.FC<RefreshIntervalMenuProps> = ({
    currentInterval,
    supportsRefreshInterval,
    onUpdate,
    onBack
}) => {
    const [editingRefreshInterval, setEditingRefreshInterval] = useState(false);
    const [refreshInput, setRefreshInput] = useState(() => getRefreshInputValue(currentInterval));
    const [validationError, setValidationError] = useState<string | null>(null);

    useInput((input, key) => {
        if (editingRefreshInterval) {
            if (key.return) {
                if (refreshInput === '') {
                    onUpdate(null);
                    setEditingRefreshInterval(false);
                    setValidationError(null);
                    return;
                }

                const error = validateRefreshIntervalInput(refreshInput);

                if (error) {
                    setValidationError(error);
                } else {
                    const value = parseInt(refreshInput, 10);
                    onUpdate(value);
                    setEditingRefreshInterval(false);
                    setValidationError(null);
                }
            } else if (key.escape) {
                setRefreshInput(getRefreshInputValue(currentInterval));
                setEditingRefreshInterval(false);
                setValidationError(null);
            } else if (key.backspace) {
                setRefreshInput(refreshInput.slice(0, -1));
                setValidationError(null);
            } else if (key.delete) {
                // No cursor position in simple input
            } else if (shouldInsertInput(input, key) && /\d/.test(input)) {
                const newValue = refreshInput + input;
                if (newValue.length <= 2) {
                    setRefreshInput(newValue);
                    setValidationError(null);
                }
            }
            return;
        }

        if (key.escape) {
            onBack();
        }
    });

    return (
        <Box flexDirection='column'>
            <Text bold>配置状态行</Text>
            <Text color='white'>配置 Claude Code 状态行设置</Text>

            {editingRefreshInterval ? (
                <Box marginTop={1} flexDirection='column'>
                    <Text>
                        输入刷新间隔（秒，1-60）:
                        {' '}
                        {refreshInput}
                        {refreshInput.length > 0 ? ' 秒' : ''}
                    </Text>
                    {validationError ? (
                        <Text color='red'>{validationError}</Text>
                    ) : (
                        <Text dimColor>按 Enter 确认，ESC 取消。留空即移除。</Text>
                    )}
                </Box>
            ) : (
                <List
                    marginTop={1}
                    items={buildConfigureStatusLineItems(currentInterval, supportsRefreshInterval)}
                    onSelect={(value) => {
                        if (value === 'back') {
                            onBack();
                            return;
                        }

                        setRefreshInput(getRefreshInputValue(currentInterval));
                        setEditingRefreshInterval(true);
                    }}
                    showBackButton={true}
                />
            )}
        </Box>
    );
};
