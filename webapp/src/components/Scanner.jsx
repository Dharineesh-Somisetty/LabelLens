import { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

const Scanner = ({ onScanSuccess, onScanFailure }) => {
    useEffect(() => {
        const scanner = new Html5QrcodeScanner(
            "reader",
            {
                fps: 10,
                qrbox: { width: 250, height: 250 },
                aspectRatio: 1.0
            },
            /* verbose= */ false
        );

        scanner.render(onScanSuccess, onScanFailure);

        return () => {
            scanner.clear().catch(error => {
                console.error("Failed to clear html5-qrcode scanner. ", error);
            });
        };
    }, [onScanSuccess, onScanFailure]);

    return (
        <div className="w-full max-w-md mx-auto">
            <div id="reader" className="overflow-hidden rounded-xl border border-white/20 shadow-2xl"></div>
            <p className="text-center text-sm text-gray-400 mt-4">
                Point your camera at a barcode
            </p>
        </div>
    );
};

export default Scanner;
