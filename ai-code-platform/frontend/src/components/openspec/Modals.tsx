'use client';

import { useState, useRef } from 'react';
import {
    X,
    Upload,
    Loader2,
    Code2,
    AlertCircle
} from 'lucide-react';

/* --- Base Modal --- */
interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, children, footer }: ModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="px-6 py-6">{children}</div>
                {footer && (
                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
}

/* --- Upload Modal --- */
interface UploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUpload: (file: File) => void;
    isUploading: boolean;
}

export function UploadModal({ isOpen, onClose, onUpload, isUploading }: UploadModalProps) {
    const [dragActive, setDragActive] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
        }
    };

    const handleFile = (file: File) => {
        if (file.name.endsWith('.zip')) {
            onUpload(file);
        } else {
            alert("Please upload a .zip file");
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Upload OpenSpec">
            <div
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${dragActive
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-300 hover:border-gray-400"
                    }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
            >
                <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                        <Upload className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="font-medium text-gray-700">
                            Drag and drop your OpenSpec file
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                            or <button onClick={() => inputRef.current?.click()} className="text-blue-600 hover:underline">browse files</button>
                        </p>
                    </div>
                    <p className="text-xs text-gray-400 uppercase mt-2">
                        Supported: .ZIP containing OpenSpec
                    </p>
                </div>
                <input
                    ref={inputRef}
                    type="file"
                    className="hidden"
                    accept=".zip"
                    onChange={handleChange}
                />
            </div>
            {isUploading && (
                <div className="mt-4 flex items-center justify-center gap-2 text-sm text-blue-600">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Uploading and processing...
                </div>
            )}
        </Modal>
    );
}

/* --- Generate Code Modal --- */
interface GenerateCodeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onGenerate: (branchName: string, prompt: string) => void;
}

export function GenerateCodeModal({ isOpen, onClose, onGenerate }: GenerateCodeModalProps) {
    const [branchName, setBranchName] = useState('openspec-impl-' + new Date().getTime());
    const [prompt, setPrompt] = useState('');

    const handleSubmit = () => {
        onGenerate(branchName, prompt);
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Start Implementation"
            footer={
                <>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <Code2 className="w-4 h-4" />
                        Start Implementation
                    </button>
                </>
            }
        >
            <div className="space-y-4">
                <div className="bg-blue-50 p-3 rounded-lg flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-blue-800">
                        This will create a new branch, push your specifications, and trigger the AI agent to implement the changes.
                    </p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Feature Branch Name
                    </label>
                    <input
                        type="text"
                        value={branchName}
                        onChange={(e) => setBranchName(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                        placeholder="feature/implementation-name"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Additional Instructions (Prompt)
                    </label>
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all h-24 resize-none"
                        placeholder="E.g., Focus on creating clean, modular code following the repository patterns..."
                    />
                </div>
            </div>
        </Modal>
    );
}

/* --- Loading Overlay --- */
export function LoadingOverlay({ message }: { message: string }) {
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-white bg-opacity-80 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                <p className="font-medium text-gray-800 animate-pulse">{message}</p>
            </div>
        </div>
    );
}
