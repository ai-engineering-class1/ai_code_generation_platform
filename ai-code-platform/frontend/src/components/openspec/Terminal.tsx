'use client';

import { useEffect, useRef, useState } from 'react';
import { Terminal as XTerm } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';
import { X, Maximize2, Minimize2 } from 'lucide-react';

interface TerminalProps {
    isOpen: boolean;
    onClose: () => void;
    mode?: 'fixed' | 'embedded';
}

export default function Terminal({ isOpen, onClose, mode = 'fixed' }: TerminalProps) {
    const terminalRef = useRef<HTMLDivElement>(null);
    const xtermRef = useRef<XTerm | null>(null);
    const fitAddonRef = useRef<FitAddon | null>(null);
    const wsRef = useRef<WebSocket | null>(null);
    const [isMaximized, setIsMaximized] = useState(false);

    useEffect(() => {
        if (!isOpen || !terminalRef.current) return;

        // Initialize xterm if not already done
        if (!xtermRef.current) {
            const term = new XTerm({
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
            fitAddon.fit();

            xtermRef.current = term;
            fitAddonRef.current = fitAddon;

            // Connect to WebSocket
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            // Start with base URL from env or default
            let apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8082';
            // Remove trailing slash if present
            apiBase = apiBase.replace(/\/$/, '');

            // Construct WS URL: replace protocol, append /api/v1/terminal/ws
            // Ensure we handle https/wss vs http/ws logic if apiBase has protocol
            const wsUrl = apiBase.replace(/^http/, 'ws') + '/api/v1/terminal/ws';

            console.log('Connecting to Terminal WebSocket:', wsUrl);
            term.write(`\r\n\x1b[90mConnecting to service at ${wsUrl}...\x1b[0m\r\n`);

            console.log('Connecting to Terminal WebSocket:', wsUrl);
            const ws = new WebSocket(wsUrl);

            ws.onopen = () => {
                term.write('\r\n\x1b[32mConnected to PowerShell Console\x1b[0m\r\n');
                ws.send('dir\r'); // Initial command to show something
            };

            ws.onmessage = (event) => {
                term.write(event.data);
            };

            ws.onclose = () => {
                term.write('\r\n\x1b[31mConnection closed\x1b[0m\r\n');
            };

            ws.onerror = (err) => {
                console.error('WebSocket error:', err);
                term.write('\r\n\x1b[31mConnection error\x1b[0m\r\n');
            };

            // Send input to server
            term.onData((data) => {
                if (ws.readyState === WebSocket.OPEN) {
                    ws.send(data);
                }
            });

            wsRef.current = ws;

            // Handle resize
            const handleResize = () => {
                fitAddon.fit();
            };
            window.addEventListener('resize', handleResize);

            return () => {
                window.removeEventListener('resize', handleResize);
                ws.close();
                term.dispose();
                xtermRef.current = null;
                wsRef.current = null;
            };
        }
    }, [isOpen]);

    // Refit when maximized/minimized or opened
    useEffect(() => {
        if (isOpen && fitAddonRef.current) {
            // Small delay to allow transition to finish
            setTimeout(() => {
                fitAddonRef.current?.fit();
            }, 300);
        }
    }, [isOpen, isMaximized]);

    if (!isOpen) return null;

    const fixedClasses = `fixed bottom-0 left-0 right-0 bg-[#1e1e1e] border-t border-gray-700 shadow-2xl transition-all duration-300 z-50 flex flex-col ${isMaximized ? 'h-[80vh]' : 'h-64'}`;
    const embeddedClasses = `h-full w-full bg-[#1e1e1e] flex flex-col`;

    return (
        <div
            className={mode === 'embedded' ? embeddedClasses : fixedClasses}
        >
            {/* Terminal Header */}
            <div className="flex items-center justify-between px-4 py-2 bg-[#2d2d2d] border-b border-gray-700 select-none">
                <span className="text-gray-300 text-sm font-medium flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                    PowerShell Console
                </span>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsMaximized(!isMaximized)}
                        className="p-1 hover:bg-gray-600 rounded text-gray-400 hover:text-white transition-colors"
                    >
                        {isMaximized ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                    </button>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-red-600 rounded text-gray-400 hover:text-white transition-colors"
                    >
                        <X size={14} />
                    </button>
                </div>
            </div>

            {/* Terminal Content */}
            <div className="flex-1 overflow-hidden p-2">
                <div ref={terminalRef} className="h-full w-full" />
            </div>
        </div>
    );
}
