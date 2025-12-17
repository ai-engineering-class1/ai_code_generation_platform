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

export default function Terminal({ isOpen, onClose, mode = 'fixed', onStatusChange }: TerminalProps) {
    const terminalRef = useRef<HTMLDivElement>(null);
    const xtermRef = useRef<XTerm | null>(null);
    const fitAddonRef = useRef<FitAddon | null>(null);
    const wsRef = useRef<WebSocket | null>(null);
    const isMounted = useRef(false);

    const [isMaximized, setIsMaximized] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [isSafeMode, setIsSafeMode] = useState(true);
    const [terminalTitle, setTerminalTitle] = useState('Terminal Console');

    // Helper to safely fit the terminal
    const safeFit = () => {
        if (!fitAddonRef.current || !xtermRef.current || !terminalRef.current) return;
        if (terminalRef.current.clientWidth === 0 || terminalRef.current.clientHeight === 0) return;
        if (!terminalRef.current.offsetParent) return;
        // @ts-ignore
        if (xtermRef.current._core && xtermRef.current._core._isDisposed) return;

        try {
            fitAddonRef.current.fit();
        } catch (e) { }
    };

    useEffect(() => {
        if (!isOpen || !terminalRef.current) return;
        isMounted.current = true;

        let resizeObserver: ResizeObserver | null = null;
        let term: XTerm | null = null;
        let ws: WebSocket | null = null;
        let connectTimer: NodeJS.Timeout | null = null;

        // 1. Initialize UI
        const initUI = () => {
            if (!terminalRef.current) return;
            if (xtermRef.current) return;

            term = new XTerm({
                cursorBlink: true,
                theme: { background: '#1e1e1e', foreground: '#ffffff' },
                fontSize: 14,
                fontFamily: 'Consolas, "Courier New", monospace',
                convertEol: true,
            });

            const fitAddon = new FitAddon();
            term.loadAddon(fitAddon);
            term.open(terminalRef.current);
            xtermRef.current = term;
            fitAddonRef.current = fitAddon;
            safeFit();

            // Warmup write - helpful for waking up metrics, harmless to keep
            term.write(' ');
            term.write('\b');
        };

        // 2. Connect Logic
        const connect = () => {
            if (!term || ws || !isMounted.current) return;
            safeFit(); // Final measure before connect

            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            let apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
            apiBase = apiBase.replace(/\/$/, '');

            const wsUrl = apiBase.replace(/^http/, 'ws') + `/api/v1/terminal/ws?cols=${term.cols}&rows=${term.rows}`;


            term.write(`\x1b[90mConnecting...\x1b[0m\r\n`);

            ws = new WebSocket(wsUrl);

            ws.onopen = () => {
                if (!isMounted.current) { ws?.close(); return; }
                setIsConnected(true);
                if (onStatusChange) onStatusChange(true);

                // FORCE PTY INITIALIZATION
                // Some Windows PTYs (ConPTY) need an explicit 'resize' event to sync line discipline
                // and fix "missing newline" bugs. If the browser doesn't resize naturally, we force it.
                setTimeout(() => {
                    if (ws?.readyState === WebSocket.OPEN && term) {
                        // "Wiggle" the dimensions to FORCE a PTY update.
                        // Some systems ignore resize events if the dimensions haven't changed.
                        // We shrink by 1 col, then restore immediately.
                        ws.send(JSON.stringify({ type: 'resize', cols: term.cols - 1, rows: term.rows }));
                        ws.send(JSON.stringify({ type: 'resize', cols: term.cols, rows: term.rows }));
                    }
                }, 500);
            };

            ws.onmessage = (event) => {
                try {
                    const msg = JSON.parse(event.data);
                    if (msg.type === 'output') {
                        term?.write(msg.data);
                    }
                    else if (msg.type === 'setup') {
                        setTerminalTitle(msg.title);
                        setIsSafeMode(msg.safe_mode);
                        term?.write(`\r\n\x1b[32mConnected to ${msg.title}\x1b[0m\r\n`);
                    }
                } catch (e) { term?.write(event.data); }
            };

            ws.onclose = () => {
                setIsConnected(false);
                if (onStatusChange) onStatusChange(false);
                wsRef.current = null;
            };

            ws.onerror = (err) => {
                console.error('WebSocket error:', err);
                setIsConnected(false);
            };

            term.onData((data) => {
                if (ws?.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({ type: 'input', data }));
                }
            });

            term.onResize((size) => {
                if (ws?.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({ type: 'resize', cols: size.cols, rows: size.rows }));
                }
            });

            wsRef.current = ws;
        };

        // Simplified Startup - Standard Debounce only
        const initTerminal = async () => {
            // Ensure element is ready
            if (!terminalRef.current || terminalRef.current.clientWidth === 0) {
                setTimeout(initTerminal, 50);
                return;
            }

            initUI();

            // Standard debounce to allow initial layout to settle
            // We accept whatever size we have after 300ms.
            // If it's 298, it's 298. If it's 114, it's 114.
            connectTimer = setTimeout(() => {
                if (isMounted.current) connect();
            }, 300);

            // Observe resizes immediately
            if (terminalRef.current) {
                resizeObserver = new ResizeObserver(() => {
                    if (!isMounted.current) return;
                    safeFit();

                    // If we are waiting to connect, reset the timer (debounce)
                    if (!wsRef.current && connectTimer) {
                        clearTimeout(connectTimer);
                        connectTimer = setTimeout(() => { if (isMounted.current) connect(); }, 300);
                    }
                });
                resizeObserver.observe(terminalRef.current);
            }
        };

        initTerminal();

        return () => {
            isMounted.current = false;
            if (connectTimer) clearTimeout(connectTimer);
            if (resizeObserver) resizeObserver.disconnect();
            if (ws) ws.close();
            if (term) { try { term.dispose(); } catch (e) { } }
            xtermRef.current = null;
            wsRef.current = null;
            fitAddonRef.current = null;
        };
    }, [isOpen]);

    // Refit when maximized/minimized or opened
    useEffect(() => {
        let fitTimer: NodeJS.Timeout;
        if (isOpen && fitAddonRef.current) {
            fitTimer = setTimeout(() => { safeFit(); }, 300);
        }
        return () => { clearTimeout(fitTimer); };
    }, [isOpen, isMaximized, isMinimized]);

    if (!isOpen) return null;

    const fixedClasses = `fixed bottom-0 left-0 right-0 bg-[#1e1e1e] border-t border-gray-700 shadow-2xl z-50 flex flex-col ${isMinimized ? 'h-10' : (isMaximized ? 'h-[80vh]' : 'h-64')}`;
    const embeddedClasses = `h-full w-full bg-[#1e1e1e] flex flex-col`;
    const popupClasses = `fixed ${isMinimized ? 'bottom-0 left-4 w-[300px] h-10 translate-y-0 translate-x-0' : 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[900px] h-[600px]'} bg-[#1e1e1e] border border-gray-700 shadow-2xl z-50 flex flex-col rounded-lg overflow-hidden`;

    return (
        <div className={mode === 'embedded' ? embeddedClasses : (mode === 'popup' ? popupClasses : fixedClasses)}>
            {/* Terminal Header */}
            {mode !== 'embedded' && (
                <div className="flex items-center justify-between px-4 py-2 bg-[#2d2d2d] border-b border-gray-200 select-none">
                    <span className="text-gray-300 text-sm font-medium flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
                        {terminalTitle} {!isSafeMode && <span className="text-xs text-red-500 font-bold ml-2 border border-red-500 rounded px-1">(Safe mode off)</span>}
                    </span>
                    <div className="flex items-center gap-2">
                        <button onClick={() => { setIsMinimized(!isMinimized); setIsMaximized(false); }} className="p-1 hover:bg-gray-600 rounded text-gray-400 hover:text-white transition-colors">
                            {isMinimized ? <Maximize2 size={14} /> : <Minus size={14} />}
                        </button>
                        {mode !== 'popup' && !isMinimized && (
                            <button onClick={() => setIsMaximized(!isMaximized)} className="p-1 hover:bg-gray-600 rounded text-gray-400 hover:text-white transition-colors">
                                {isMaximized ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                            </button>
                        )}
                        <button onClick={onClose} className="p-1 hover:bg-red-600 rounded text-gray-400 hover:text-white transition-colors">
                            <X size={14} />
                        </button>
                    </div>
                </div>
            )}
            <div className={`flex-1 overflow-hidden p-2 ${mode === 'embedded' ? 'h-full' : ''} ${isMinimized ? 'hidden' : ''}`}>
                <div ref={terminalRef} className="h-full w-full" />
            </div>
        </div>
    );
}
