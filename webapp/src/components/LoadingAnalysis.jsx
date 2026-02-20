import { useEffect, useState } from 'react';
import { extractTextFromImage } from '../services/ocr';
import { analyzeIngredients } from '../services/api';

const LoadingAnalysis = ({ imageFile, initialText, mode, onComplete, onError }) => {
    const [progress, setProgress] = useState(0);
    const [stage, setStage] = useState('extracting'); // 'extracting' | 'analyzing' | 'complete'
    const [statusMessage, setStatusMessage] = useState('Extracting text from image...');

    useEffect(() => {
        const performAnalysis = async () => {
            try {
                let ingredients = [];

                if (initialText) {
                    // Skip OCR if we have text from barcode
                    // Split the text into a list of ingredients
                    ingredients = initialText.split(',').map(i => i.trim()).filter(i => i.length > 0);
                    setProgress(50);
                } else {
                    // Stage 1: OCR
                    setStage('extracting');
                    setStatusMessage('Extracting text from image...');

                    const extractedText = await extractTextFromImage(imageFile, (ocrProgress) => {
                        setProgress(ocrProgress * 50); // OCR takes 50% of progress
                    });

                    if (!extractedText || extractedText.length === 0) {
                        throw new Error('No ingredients found in the image. Please try a clearer photo.');
                    }
                    ingredients = extractedText;
                }

                // Stage 2: Analysis
                setStage('analyzing');
                setStatusMessage(`Analyzing ingredients...`);
                setProgress(60);

                const result = await analyzeIngredients(ingredients, mode);


                setProgress(90);
                setStatusMessage('Preparing results...');

                // Add a small delay for smooth transition
                setTimeout(() => {
                    setProgress(100);
                    setStage('complete');
                    onComplete(result);
                }, 500);

            } catch (error) {
                console.error('Analysis failed:', error);
                onError(error);
            }
        };

        performAnalysis();
    }, [imageFile, mode, onComplete, onError]);

    return (
        <div className="min-h-screen flex items-center justify-center px-4">
            <div className="max-w-md w-full glass-strong p-12 text-center animate-fade-in">
                {/* Animated Icon */}
                <div className="mb-8">
                    {stage === 'extracting' && (
                        <div className="text-7xl animate-pulse">🔍</div>
                    )}
                    {stage === 'analyzing' && (
                        <div className="text-7xl animate-spin-slow">⚗️</div>
                    )}
                    {stage === 'complete' && (
                        <div className="text-7xl animate-bounce">✨</div>
                    )}
                </div>

                {/* Title */}
                <h2 className="text-3xl font-bold mb-4 gradient-text">
                    {stage === 'extracting' && 'Reading Ingredients'}
                    {stage === 'analyzing' && 'Analyzing Quality'}
                    {stage === 'complete' && 'Almost Ready!'}
                </h2>

                {/* Status Message */}
                <p className="text-gray-300 mb-8">{statusMessage}</p>

                {/* Progress Bar */}
                <div className="w-full bg-white/10 rounded-full h-3 mb-4 overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-primary-500 to-accent-500 transition-all duration-500 ease-out rounded-full"
                        style={{ width: `${progress}%` }}
                    />
                </div>

                {/* Progress Percentage */}
                <p className="text-sm text-gray-400">
                    {Math.round(progress)}% Complete
                </p>

                {/* Fun Loading Messages */}
                <div className="mt-8 text-sm text-gray-500 italic">
                    {progress < 30 && "Reading the fine print..."}
                    {progress >= 30 && progress < 60 && "Checking ingredient quality..."}
                    {progress >= 60 && progress < 90 && "Calculating your Apex Score..."}
                    {progress >= 90 && "Finalizing insights..."}
                </div>
            </div>
        </div>
    );
};

export default LoadingAnalysis;
