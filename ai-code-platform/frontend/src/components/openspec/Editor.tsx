'use client';

import { useState, useEffect } from 'react';
import {
    FileCode,
    Eye,
    Lightbulb,
    Sparkles,
    Save,
    Bold,
    Italic,
    List,
    Link,
    Bot,
    RefreshCw,
    Check,
    X,
    TerminalSquare,
    Download,
    UserPlus
} from 'lucide-react';
import { Specification, Suggestion, TabType } from '@/lib/types/openspec';
import dynamic from 'next/dynamic';

const Terminal = dynamic(() => import('@/components/openspec/Terminal'), { ssr: false });

interface EditorProps {
    specification?: Specification;
    content: string;
    onContentChange: (value: string) => void;
    onGenerateSuggestions: () => void;
    suggestions: Suggestion[];
    isLoading?: boolean;
    onOpenTerminal: () => void;
    isTerminalConnected?: boolean;
}

export default function Editor({
    specification,
    content,
    onContentChange,
    onGenerateSuggestions,
    suggestions,
    isLoading = false,
    onOpenTerminal,
    isTerminalConnected = false,
}: EditorProps) {
    const [activeTab, setActiveTab] = useState<TabType>('specification');
    // Content state hoisted to parent



    const handleToolbarAction = (action: string) => {
        const textarea = document.getElementById('specEditor') as HTMLTextAreaElement;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = content.substring(start, end);
        let replacement = '';

        switch (action) {
            case 'bold':
                replacement = `**${selectedText}**`;
                break;
            case 'italic':
                replacement = `*${selectedText}*`;
                break;
            case 'list':
                replacement = `- ${selectedText}`;
                break;
            case 'link':
                const url = prompt('Enter URL:');
                if (url) {
                    replacement = `[${selectedText}](${url})`;
                } else {
                    return;
                }
                break;
        }

        const newContent = content.substring(0, start) + replacement + content.substring(end);
        onContentChange(newContent);
    };

    const renderMarkdownPreview = () => {
        if (!content) {
            return (
                <div className="text-center py-16 text-gray-400">
                    <Eye className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Select a specification to preview</p>
                </div>
            );
        }

        // Simple markdown-to-HTML conversion
        let html = content
            .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>')
            .replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold mt-6 mb-3">$1</h2>')
            .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-8 mb-4">$1</h1>')
            .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
            .replace(/\*(.*)\*/gim, '<em>$1</em>')
            .replace(/^- (.*$)/gim, '<li class="ml-4">$1</li>')
            .replace(/\n\n/gim, '</p><p class="mb-3">')
            .replace(/^(.*)$/gim, '<p class="mb-3">$1</p>');

        return (
            <div
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: html }}
            />
        );
    };

    const tabs = [
        { id: 'specification' as TabType, label: 'Markdown', icon: FileCode },
        { id: 'preview' as TabType, label: 'Preview', icon: Eye },
        { id: 'suggestions' as TabType, label: 'AI Suggestions', icon: Sparkles },
    ];

    return (
        <section className="flex-1 flex flex-col overflow-hidden bg-white relative">
            {/* Editor Header */}
            <div className="flex items-center justify-between px-4 h-14 border-b border-gray-200 bg-white">
                <div className="flex items-center h-full gap-6">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 h-full px-1 text-sm font-medium transition-colors border-b-2 ${isActive
                                    ? 'border-blue-600 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                            >
                                <Icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* Right side buttons moved to Page Header */}
            </div>

            {/* Editor Content */}
            <div className="flex-1 overflow-hidden relative">
                {/* Specification Tab */}
                {activeTab === 'specification' && (
                    <div className="h-full flex flex-col">
                        <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-200">
                            <span className="text-sm font-medium text-gray-700">
                                {specification?.name || 'Select a file'}
                            </span>

                            <div className="flex gap-1">
                                {[
                                    { action: 'bold', icon: Bold },
                                    { action: 'italic', icon: Italic },
                                    { action: 'list', icon: List },
                                    { action: 'link', icon: Link },
                                ].map(({ action, icon: Icon }) => (
                                    <button
                                        key={action}
                                        onClick={() => handleToolbarAction(action)}
                                        className="p-2 border border-gray-300 bg-white rounded hover:bg-gray-100 transition-colors text-xs"
                                        title={action}
                                    >
                                        <Icon className="w-3 h-3" />
                                    </button>
                                ))}
                            </div>
                        </div>

                        <textarea
                            id="specEditor"
                            value={content}
                            onChange={(e) => onContentChange(e.target.value)}
                            placeholder="Select a specification from the left panel to edit..."
                            className="flex-1 p-4 font-mono text-sm resize-none border-none outline-none focus:ring-0"
                            spellCheck={false}
                        />
                    </div>
                )}

                {/* Preview Tab */}
                {activeTab === 'preview' && (
                    <div className="h-full overflow-y-auto p-6 max-w-3xl mx-auto">
                        {renderMarkdownPreview()}
                    </div>
                )}

                {/* Suggestions Tab */}
                {activeTab === 'suggestions' && (
                    <div className="h-full flex flex-col items-center justify-center space-y-4 p-8 bg-gray-50">
                        <div className="text-center">
                            <Sparkles className="w-12 h-12 text-blue-500 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">AI Suggestions & Tools</h3>
                            <p className="text-gray-500 max-w-md mx-auto mb-8">
                                Use AI to analyze your specification or open the terminal to interact with the system directly.
                            </p>
                        </div>

                        <div className="flex gap-4">
                            <button
                                onClick={onGenerateSuggestions}
                                className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 shadow-sm text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                <Lightbulb className="w-5 h-5 text-yellow-500" />
                                <span>Generate Suggestions</span>
                            </button>

                            <button
                                onClick={onOpenTerminal}
                                disabled={isTerminalConnected}
                                className={`flex items-center gap-2 px-6 py-3 rounded-lg shadow-lg transition-colors ${isTerminalConnected
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    : 'bg-black text-white hover:bg-gray-800'
                                    }`}
                            >
                                <TerminalSquare className="w-5 h-5" />
                                <span>{isTerminalConnected ? 'Terminal Connected' : 'Open Terminal Window'}</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}
