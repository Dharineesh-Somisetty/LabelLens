import { createWorker } from 'tesseract.js';

/**
 * Extract text from an image using Tesseract.js OCR
 * @param {File} imageFile - The image file to process
 * @param {Function} onProgress - Progress callback (0-1)
 * @returns {Promise<string[]>} Array of ingredient strings
 */
export const extractTextFromImage = async (imageFile, onProgress = null) => {
    const worker = await createWorker('eng', 1, {
        logger: (m) => {
            if (onProgress && m.status === 'recognizing text') {
                onProgress(m.progress);
            }
        },
    });

    try {
        const { data: { text } } = await worker.recognize(imageFile);
        await worker.terminate();

        // Process the extracted text into ingredients
        const ingredients = processExtractedText(text);
        return ingredients;
    } catch (error) {
        console.error('OCR Error:', error);
        await worker.terminate();
        throw new Error('Failed to extract text from image. Please try again with a clearer image.');
    }
};

/**
 * Process raw OCR text into ingredient list
 * @param {string} text - Raw text from OCR
 * @returns {string[]} Cleaned ingredient array
 */
const processExtractedText = (text) => {
    // Remove common non-ingredient text patterns
    let cleaned = text
        .toLowerCase()
        .replace(/ingredients?:?/gi, '')
        .replace(/contains?:?/gi, '')
        .replace(/\d+%?/g, '') // Remove percentages and numbers
        .replace(/\(.*?\)/g, '') // Remove content in parentheses
        .trim();

    // Split by common separators
    const ingredients = cleaned
        .split(/[,;\n]+/)
        .map(ing => ing.trim())
        .filter(ing => ing.length > 2) // Filter out very short strings
        .filter(ing => !ing.match(/^[^a-z]+$/)); // Filter out non-alphabetic entries

    return ingredients;
};

/**
 * Validate if an image file is suitable for OCR
 * @param {File} file - Image file to validate
 * @returns {boolean} Whether the file is valid
 */
export const validateImageFile = (file) => {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!validTypes.includes(file.type)) {
        throw new Error('Please upload a valid image file (JPEG, PNG, or WebP)');
    }

    if (file.size > maxSize) {
        throw new Error('Image file is too large. Please upload an image under 10MB');
    }

    return true;
};
