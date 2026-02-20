import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { validateImageFile } from '../services/ocr';

import Scanner from './Scanner';

const BarcodeSearch = ({ onSearch }) => {
    const [barcode, setBarcode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isCameraMode, setIsCameraMode] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!barcode.trim()) return;
        handleSearch(barcode);
    };

    const handleSearch = async (code) => {
        setIsLoading(true);
        try {
            await onSearch(code);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleScanSuccess = (decodedText) => {
        // Stop scanning after success if needed, or just fill input
        console.log("Scanned:", decodedText);
        setBarcode(decodedText);
        setIsCameraMode(false); // Switch back to view result
        handleSearch(decodedText);
    };

    const handleScanFailure = (error) => {
        // console.warn(error); // Ignore frame failures
    };

    return (
        <div className="glass-strong p-6 mb-8 text-center animate-slide-up">
            <h3 className="text-lg font-semibold mb-4 text-gray-200">Search by Barcode</h3>

            {/* Toggle Buttons */}
            <div className="flex justify-center gap-4 mb-6">
                <button
                    onClick={() => setIsCameraMode(false)}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${!isCameraMode
                        ? 'bg-white text-primary-900'
                        : 'bg-white/10 text-gray-400 hover:bg-white/20'
                        }`}
                >
                    ⌨️ Enter Manually
                </button>
                <button
                    onClick={() => setIsCameraMode(true)}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${isCameraMode
                        ? 'bg-white text-primary-900'
                        : 'bg-white/10 text-gray-400 hover:bg-white/20'
                        }`}
                >
                    📸 Scan Barcode
                </button>
            </div>

            {isCameraMode ? (
                <Scanner
                    onScanSuccess={handleScanSuccess}
                    onScanFailure={handleScanFailure}
                />
            ) : (
                <form onSubmit={handleSubmit}>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={barcode}
                            onChange={(e) => setBarcode(e.target.value)}
                            placeholder="Enter barcode number..."
                            className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 transition-colors"
                        />
                        <button
                            type="submit"
                            disabled={isLoading || !barcode}
                            className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? '...' : '🔍'}
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
};

const UploadSection = ({ onAnalysisStart, onBarcodeSearch }) => {
    const [selectedImage, setSelectedImage] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [mode, setMode] = useState('BULK');

    const onDrop = useCallback((acceptedFiles) => {
        const file = acceptedFiles[0];
        if (!file) return;

        try {
            validateImageFile(file);
            setSelectedImage(file);

            // Create preview URL
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
        } catch (error) {
            alert(error.message);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/*': ['.jpeg', '.jpg', '.png', '.webp']
        },
        maxFiles: 1,
    });

    const handleAnalyze = () => {
        if (selectedImage) {
            onAnalysisStart(selectedImage, mode);
        }
    };

    const handleClear = () => {
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
        }
        setSelectedImage(null);
        setPreviewUrl(null);
    };

    return (
        <div className="container mx-auto px-4 py-12">
            {/* Hero Section */}
            <div className="text-center mb-12 animate-fade-in">
                <h1 className="text-6xl font-display font-bold mb-4 gradient-text">
                    BuyRight
                </h1>
                <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                    AI-Powered Ingredient Analysis for Smarter Nutrition Choices
                </p>
                <p className="text-gray-400 mt-2">
                    Upload a photo or scan a barcode to get instant insights
                </p>
            </div>

            {/* Barcode Search */}
            <div className="max-w-md mx-auto mb-8 animate-slide-up">
                <BarcodeSearch onSearch={onBarcodeSearch} />
            </div>

            {/* Mode Selector */}
            <div className="max-w-md mx-auto mb-8 animate-slide-up">
                <div className="glass-strong p-6 text-center">
                    <h3 className="text-lg font-semibold mb-4 text-gray-200">Select Your Goal</h3>
                    <div className="flex gap-4 justify-center">
                        <button
                            onClick={() => setMode('BULK')}
                            className={`px-8 py-3 rounded-xl font-semibold transition-all duration-300 ${mode === 'BULK'
                                ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-glow'
                                : 'glass hover:bg-white/15 text-gray-300'
                                }`}
                        >
                            💪 BULK
                        </button>
                        <button
                            onClick={() => setMode('CUT')}
                            className={`px-8 py-3 rounded-xl font-semibold transition-all duration-300 ${mode === 'CUT'
                                ? 'bg-gradient-to-r from-accent-500 to-accent-600 text-white shadow-glow-accent'
                                : 'glass hover:bg-white/15 text-gray-300'
                                }`}
                        >
                            🔥 CUT
                        </button>
                    </div>
                </div>
            </div>

            {/* Upload Zone */}
            <div className="max-w-3xl mx-auto">
                <div
                    {...getRootProps()}
                    className={`upload-zone p-12 text-center ${isDragActive ? 'active' : ''} ${previewUrl ? 'border-solid' : ''
                        }`}
                >
                    <input {...getInputProps()} />

                    {!previewUrl ? (
                        <div className="animate-slide-up">
                            <div className="text-6xl mb-4 animate-float">📸</div>
                            <h3 className="text-2xl font-bold mb-2 text-white">
                                {isDragActive ? 'Drop your image here' : 'Upload Ingredient Photo'}
                            </h3>
                            <p className="text-gray-400 mb-6">
                                Drag and drop or click to select a photo of your product's ingredient list
                            </p>
                            <div className="inline-block px-6 py-3 bg-white/10 rounded-lg text-sm text-gray-300">
                                Supports: JPEG, PNG, WebP (Max 10MB)
                            </div>
                        </div>
                    ) : (
                        <div className="animate-fade-in">
                            <img
                                src={previewUrl}
                                alt="Preview"
                                className="max-h-96 mx-auto rounded-lg shadow-2xl mb-4"
                            />
                            <p className="text-green-400 font-semibold mb-4">✓ Image uploaded successfully</p>
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                {previewUrl && (
                    <div className="flex gap-4 justify-center mt-8 animate-slide-up">
                        <button
                            onClick={handleClear}
                            className="btn-secondary"
                        >
                            Clear Image
                        </button>
                        <button
                            onClick={handleAnalyze}
                            className="btn-primary flex items-center gap-2"
                        >
                            <span>Analyze Ingredients</span>
                            <span>→</span>
                        </button>
                    </div>
                )}
            </div>

            {/* Features */}
            <div className="max-w-5xl mx-auto mt-20 grid md:grid-cols-3 gap-6">
                {[
                    {
                        icon: '🔍',
                        title: 'Smart OCR',
                        description: 'Advanced text extraction from any ingredient label',
                    },
                    {
                        icon: '📊',
                        title: 'Detailed Analysis',
                        description: 'Comprehensive breakdown of protein quality and bioavailability',
                    },
                    {
                        icon: '⚡',
                        title: 'Instant Results',
                        description: 'Get your Apex Score and recommendations in seconds',
                    },
                ].map((feature, idx) => (
                    <div key={idx} className="glass-strong p-6 text-center hover:bg-white/20 transition-all duration-300">
                        <div className="text-4xl mb-3">{feature.icon}</div>
                        <h4 className="font-bold text-lg mb-2 text-white">{feature.title}</h4>
                        <p className="text-gray-400 text-sm">{feature.description}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default UploadSection;
