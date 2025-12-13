'use client';

import { useEffect, useRef, useState } from 'react';

import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import { X, Maximize2, Minimize2, Minus } from 'lucide-react';

interface TerminalProps {
    isOpen: boolean;
    onClose: () => void;
    mode?: 'fixed' | 'embedded' | 'popup';
    onStatusChange?: (isConnected: boolean) => void;
}

const TERMINAL_PRESETS = {
    PREFERRED: { cols: 120, rows: 40 },
    MINIMAL: { cols: 80, rows: 24 }
};


export default function Terminal({ isOpen, onClose, mode = 'fixed', onStatusChange }: TerminalProps) {
    const terminalRef = useRef<HTMLDivElement>(null);
    const xtermRef = useRef<XTerm | null>(null);
    const fitAddonRef = useRef<FitAddon | null>(null);
    const wsRef = useRef<WebSocket | null>(null);
    // Buffer for local line editing
    const commandBuffer = useRef<string>('');
    const requestAnimationFrameId = useRef<number | null>(null);
    const isMounted = useRef(false);

    const [isMaximized, setIsMaximized] = useState(false);

    const [isMinimized, setIsMinimized] = useState(false);
    const [isConnected, setIsConnected] = useState(false);

    // Helper to safely fit the terminal
    const safeFit = () => {
        if (!fitAddonRef.current || !xtermRef.current || !terminalRef.current) return;

        // This is the core check: element must have dimensions and be connected to DOM
        if (terminalRef.current.clientWidth === 0 || terminalRef.current.clientHeight === 0) return;
        if (!terminalRef.current.offsetParent) return;

        // Check if xterm is disposed (internal property, but widely used)
        // @ts-ignore
        if (xtermRef.current._core && xtermRef.current._core._isDisposed) return;

        try {
            const dims = fitAddonRef.current.proposeDimensions();
            if (dims && dims.cols > 1 && dims.rows > 1) {
                fitAddonRef.current.fit();
            }
        } catch (e) {
            // ignore
        }
    };

    useEffect(() => {
        if (!isOpen || !terminalRef.current) return;
        isMounted.current = true;

        let initTimer: NodeJS.Timeout;
        let resizeObserver: ResizeObserver | null = null;
        let term: XTerm | null = null;
        let ws: WebSocket | null = null;

        const initTerminal = () => {
            // Check if element is actually visible/sized
            if (!terminalRef.current ||
                terminalRef.current.clientWidth === 0 ||
                terminalRef.current.clientHeight === 0) {
                // Not ready, try again shortly
                initTimer = setTimeout(initTerminal, 100);
                return;
            }

            // Initialize xterm if not already done
            if (!xtermRef.current) {
                term = new XTerm({
                    cursorBlink: true,
                    theme: {
                        background: '#1e1e1e',
                        foreground: '#ffffff',
                    },
                    fontSize: 14,
                    fontFamily: 'Consolas, "Courier New", monospace',
                    convertEol: true, // Crucial for Windows line endings
                });

                const fitAddon = new FitAddon();
                term.loadAddon(fitAddon);

                term.open(terminalRef.current);
                xtermRef.current = term;
                fitAddonRef.current = fitAddon;

                // Initial fit
                safeFit();

                // Use ResizeObserver to fit terminal when container dimensions change
                resizeObserver = new ResizeObserver(() => {
                    // Defer to prevent "ResizeObserver loop limit exceeded"
                    if (requestAnimationFrameId.current) cancelAnimationFrame(requestAnimationFrameId.current);
                    requestAnimationFrameId.current = window.requestAnimationFrame(() => {
                        if (isMounted.current && xtermRef.current) {
                            safeFit();
                        }
                    });
                });

                if (terminalRef.current) {
                    resizeObserver.observe(terminalRef.current);
                }

                // Connect to WebSocket
                const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
                let apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
                apiBase = apiBase.replace(/\/$/, '');

                // CRITICAL FIX: Use the ACTUAL dimensions derived from safeFit() for the connection.
                // Using preset constants caused a mismatch between the PTY (e.g. 120) and the View (e.g. 150),
                // leading to wrapping artifacts/gaps.
                const wsUrl = apiBase.replace(/^http/, 'ws') + `/api/v1/terminal/ws?cols=${term.cols}&rows=${term.rows}`;

                console.log('Connecting to Terminal WebSocket:', wsUrl);
                term.write(`\r\n\x1b[90mConnecting to service at ${wsUrl}...\x1b[0m\r\n`);

                ws = new WebSocket(wsUrl);

                ws.onopen = () => {
                    term?.write('\r\n\x1b[32mConnected to PowerShell Console\x1b[0m\r\n');
                    setIsConnected(true);
                    if (onStatusChange) onStatusChange(true);
                    // Send initial resize
                    if (term && ws?.readyState === WebSocket.OPEN) {
                        ws.send(JSON.stringify({
                            type: 'resize',
                            cols: term.cols,
                            rows: term.rows
                        }));
                    }

                };

                ws.onmessage = (event) => {
                    term?.write(event.data);
                };

                ws.onclose = () => {
                    term?.write('\r\n\x1b[31mConnection closed\x1b[0m\r\n');
                    setIsConnected(false);
                    if (onStatusChange) onStatusChange(false);
                };

                ws.onerror = (err) => {
                    console.error('WebSocket error:', err);
                    term?.write('\r\n\x1b[31mConnection error\x1b[0m\r\n');
                    setIsConnected(false);
                };

                term.onData((data) => {
                    if (ws?.readyState === WebSocket.OPEN) {
                        ws.send(JSON.stringify({
                            type: 'input',
                            data
                        }));
                    }
                });

                term.onResize((size) => {
                    if (ws?.readyState === WebSocket.OPEN) {
                        ws.send(JSON.stringify({
                            type: 'resize',
                            cols: size.cols,
                            rows: size.rows
                        }));

                    }
                });

                wsRef.current = ws;
            }
        };

        // Start initialization attempt
        initTerminal();

        return () => {
            isMounted.current = false;
            clearTimeout(initTimer);
            if (requestAnimationFrameId.current) {
                cancelAnimationFrame(requestAnimationFrameId.current);
            }
            if (resizeObserver) {
                resizeObserver.disconnect();
            }
            if (ws) {
                ws.close();
            }
            if (term) {
                try {
                    term.dispose();
                } catch (e) {
                    // ignore
                }
            }
            xtermRef.current = null;
            wsRef.current = null;
            fitAddonRef.current = null;
            commandBuffer.current = '';
        };
    }, [isOpen]);

    // Refit when maximized/minimized or opened
    useEffect(() => {
        let fitTimer: NodeJS.Timeout;
        if (isOpen && fitAddonRef.current) {
            // Small delay to allow transition to finish
            fitTimer = setTimeout(() => {
                safeFit();
            }, 300);
        }
        return () => {
            clearTimeout(fitTimer);
        };
    }, [isOpen, isMaximized, isMinimized]);

    if (!isOpen) return null;

    const fixedClasses = `fixed bottom-0 left-0 right-0 bg-[#1e1e1e] border-t border-gray-700 shadow-2xl transition-all duration-300 z-50 flex flex-col ${isMinimized ? 'h-10' : (isMaximized ? 'h-[80vh]' : 'h-64')}`;
    const embeddedClasses = `h-full w-full bg-[#1e1e1e] flex flex-col`;
    const popupClasses = `fixed ${isMinimized ? 'bottom-0 left-4 w-[300px] h-10 translate-y-0 translate-x-0' : 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[900px] h-[600px]'} bg-[#1e1e1e] border border-gray-700 shadow-2xl z-50 flex flex-col rounded-lg overflow-hidden transition-all duration-300`;

    return (
        <div
            className={mode === 'embedded' ? embeddedClasses : (mode === 'popup' ? popupClasses : fixedClasses)}
        >
            {/* Terminal Header - Hide in embedded mode */}
            {mode !== 'embedded' && (
                <div className="flex items-center justify-between px-4 py-2 bg-[#2d2d2d] border-b border-gray-200 select-none">
                    <span className="text-gray-300 text-sm font-medium flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
                        PowerShell Console
                    </span>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => {
                                setIsMinimized(!isMinimized);
                                setIsMaximized(false);
                            }}
                            className="p-1 hover:bg-gray-600 rounded text-gray-400 hover:text-white transition-colors"
                            title={isMinimized ? "Restore" : "Minimize"}
                        >
                            {isMinimized ? <Maximize2 size={14} /> : <Minus size={14} />}
                        </button>

                        {mode !== 'popup' && !isMinimized && (
                            <button
                                onClick={() => setIsMaximized(!isMaximized)}
                                className="p-1 hover:bg-gray-600 rounded text-gray-400 hover:text-white transition-colors"
                            >
                                {isMaximized ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="p-1 hover:bg-red-600 rounded text-gray-400 hover:text-white transition-colors"
                        >
                            <X size={14} />
                        </button>
                    </div>
                </div>
            )}

            {/* Terminal Content */}
            <div className={`flex-1 overflow-hidden p-2 ${mode === 'embedded' ? 'h-full' : ''} ${isMinimized ? 'hidden' : ''}`}>
                <div ref={terminalRef} className="h-full w-full" />
            </div>
        </div>
    );
}
