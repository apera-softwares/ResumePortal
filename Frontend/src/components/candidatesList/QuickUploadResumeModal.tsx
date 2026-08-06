"use client";

import React, { useState, useRef } from "react";
import { X, UploadCloud, FileText, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

interface QuickUploadResumeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (newCandidate?: any) => void;
    API_URL: string;
}

export default function QuickUploadResumeModal({
    isOpen,
    onClose,
    onSuccess,
    API_URL,
}: QuickUploadResumeModalProps) {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    const handleFileSelect = (file: File) => {
        const validTypes = [
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ];

        if (!validTypes.includes(file.type) && !file.name.match(/\.(pdf|doc|docx)$/i)) {
            toast.error("Please select a valid document format (.pdf, .doc, .docx)");
            return;
        }

        if (file.size > 10 * 1024 * 1024) { // 10MB limit
            toast.error("File size exceeds 10MB limit");
            return;
        }

        setSelectedFile(file);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileSelect(e.dataTransfer.files[0]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedFile) {
            toast.error("Please attach a resume file to upload.");
            return;
        }

        setIsUploading(true);
        const token = localStorage.getItem("token");
        const userId = localStorage.getItem("userId");

        const formData = new FormData();
        formData.append("file", selectedFile);
        if (userId) formData.append("userId", userId);

        try {
            const response = await fetch(`${API_URL}/candidates/uploadresumeOnly`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token || ""}`,
                },
                body: formData,
            });

            if (!response.ok) {
                throw new Error("Failed to upload candidate resume");
            }

            const result = await response.json();
            toast.success("Resume uploaded successfully! Within 1 to 2 mins, the candidate will appear after parsing.");
            setSelectedFile(null);
            onSuccess(result?.id ? result : undefined);
            onClose();
        } catch (error) {
            console.error("Error uploading resume:", error);
            toast.error("Resume upload failed. Please try again.");
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
            {/* Modal Container */}
            <div
                className="relative w-full max-w-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl shadow-2xl overflow-hidden transition-all transform"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-800">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                            Upload Resume
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            Upload a candidate resume PDF or Word file for automated parsing.
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={isUploading}
                        className="p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content Body */}
                <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
                    {/* Drag & Drop Area */}
                    <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`relative flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-200 ${isDragging
                            ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 scale-[0.99]"
                            : selectedFile
                                ? "border-emerald-500/50 bg-emerald-50/30 dark:bg-emerald-950/20"
                                : "border-gray-300 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 bg-gray-50/50 dark:bg-gray-800/40"
                            }`}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf,.doc,.docx"
                            className="hidden"
                            onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                    handleFileSelect(e.target.files[0]);
                                }
                            }}
                        />

                        {!selectedFile ? (
                            <>
                                <div className="w-14 h-14 mb-3 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-xs">
                                    <UploadCloud className="w-7 h-7" />
                                </div>
                                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 text-center">
                                    Click to upload or drag & drop resume
                                </p>
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                    Supports PDF, DOC, DOCX (Max 10MB)
                                </p>
                            </>
                        ) : (
                            <div className="flex items-center gap-4 w-full p-2">
                                <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                                    <FileText className="w-6 h-6" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                                        {selectedFile.name}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready to upload
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedFile(null);
                                    }}
                                    className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Action Footer */}
                    <div className="flex items-center justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isUploading}
                            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!selectedFile || isUploading}
                            className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-blue-500/20 active:scale-[0.98] transition-all cursor-pointer"
                        >
                            {isUploading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>Uploading & Processing...</span>
                                </>
                            ) : (
                                <span>Upload & Parse</span>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
