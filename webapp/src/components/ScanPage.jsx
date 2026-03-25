import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import Scanner from './Scanner';
import ProfileSelector from './ProfileSelector';
import useCameraCapture from '../hooks/useCameraCapture';
import BrandLogo from './BrandLogo';

const ScanPage = ({ onScanResult, isLoading, lastFailedBarcode = '', ocrQualityInfo, onAcceptPendingResult, onClearOcrQuality, onNavigateHowTo }) => {
    const [barcode, setBarcode] = useState('');
    const [isCameraMode, setIsCameraMode] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [showScanner, setShowScanner] = useState(false);

    // ── Label input mode: 'upload' | 'camera' ───
    const [labelMode, setLabelMode] = useState('upload');

    // ── Camera hook ──────────────────────────────
    const cam = useCameraCapture();

    // ── Manual edit state ────────────────────────
    const [editedText, setEditedText] = useState('');
    const [showManualEdit, setShowManualEdit] = useState(false);

    // ── Selected household profile ───────────────
    const [selectedProfileId, setSelectedProfileId] = useState(null);
    const [selectedProfileName, setSelectedProfileName] = useState('');

    const handleProfileSelect = (id, name) => {
        setSelectedProfileId(id);
        if (name) setSelectedProfileName(name);
    };

    // Stop camera when switching back to upload mode
    useEffect(() => {
        if (labelMode === 'upload') {
            cam.reset();
        }
    }, [labelMode]); // eslint-disable-line react-hooks/exhaustive-deps

    // Start camera when switching to camera mode
    useEffect(() => {
        if (labelMode === 'camera' && cam.state === 'idle') {
            cam.startCamera();
        }
    }, [labelMode]); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Barcode submit ───────────────────────────
    const handleBarcodeSubmit = (e) => {
        e?.preventDefault();
        if (!barcode.trim()) return;
        onScanResult({
            type: 'barcode',
            barcode: barcode.trim(),
            userProfile: {},
            profileId: selectedProfileId,
            profileName: selectedProfileName,
        });
    };

    const handleScanSuccess = (decodedText) => {
        setBarcode(decodedText);
        setIsCameraMode(false);
        onScanResult({
            type: 'barcode',
            barcode: decodedText,
            userProfile: {},
            profileId: selectedProfileId,
            profileName: selectedProfileName,
        });
    };

    // ── Image upload (dropzone) ──────────────────
    const onDrop = useCallback((files) => {
        const file = files[0];
        if (!file) return;
        setSelectedImage(file);
        setPreviewUrl(URL.createObjectURL(file));
        clearOcrState();
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] },
        maxFiles: 1,
    });

    const clearImage = () => {
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setSelectedImage(null);
        setPreviewUrl(null);
        clearOcrState();
    };

    const clearOcrState = () => {
        if (onClearOcrQuality) onClearOcrQuality();
        setEditedText('');
        setShowManualEdit(false);
    };

    // ── Submit image for analysis ────────────────
    const submitImage = (imageFile) => {
        onScanResult({
            type: 'label',
            imageFile,
            barcode: lastFailedBarcode,
            userProfile: {},
            profileId: selectedProfileId,
            profileName: selectedProfileName,
        });
    };

    const handleImageSubmit = () => {
        if (!selectedImage) return;
        submitImage(selectedImage);
    };

    // ── Camera "Use Photo" handler ───────────────
    const handleUsePhoto = () => {
        if (!cam.capturedBlob) return;
        const file = new File([cam.capturedBlob], 'camera-capture.jpg', { type: 'image/jpeg' });
        submitImage(file);
    };

    // ── Retake from OCR error ────────────────────
    const handleRetakeFromError = () => {
        clearOcrState();
        clearImage();
        setLabelMode('camera');
    };

    const handleSwitchToUpload = () => {
        clearOcrState();
        clearImage();
        cam.reset();
        setLabelMode('upload');
    };

    // ── "Continue anyway" – accept the pending result despite low quality
    const handleContinueAnyway = () => {
        setShowManualEdit(true);
        if (ocrQualityInfo?.rawText) {
            setEditedText(ocrQualityInfo.rawText);
        }
    };

    // ── Manual edit: accept pending result (backend already analyzed it)
    const handleManualAnalyze = () => {
        if (onAcceptPendingResult) onAcceptPendingResult();
    };

    return (
        <div className="min-h-screen bg-cn-surface text-cn-on-surface">
            <div className="mx-auto max-w-7xl px-6 py-8 space-y-12">

                {/* ── Hero: Dietary Profile Summary ── */}
                <section className="relative overflow-hidden animate-fade-in">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div className="space-y-4">
                            <h2 className="text-4xl font-headline font-bold text-cn-on-surface tracking-tight">
                                Your Dietary Profile
                            </h2>
                            <div className="flex flex-wrap gap-3">
                                <ProfileSelector
                                    selectedId={selectedProfileId}
                                    onSelect={handleProfileSelect}
                                />
                            </div>
                        </div>
                        <div className="hidden md:block">
                            <button
                                onClick={onNavigateHowTo}
                                className="text-sm text-cn-outline font-medium max-w-xs text-right hover:text-cn-primary transition-colors"
                            >
                                How it works &rarr;
                            </button>
                        </div>
                    </div>
                </section>

                {/* ── Primary CTA: Start Scanning ── */}
                {!showScanner && (
                    <section className="relative animate-slide-up">
                        <div className="bg-gradient-to-br from-cn-primary to-cn-primary-container rounded-[2rem] p-12 text-center text-cn-on-primary shadow-soft relative overflow-hidden group">
                            {/* Abstract texture background */}
                            <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(circle_at_30%_20%,_var(--tw-gradient-stops))] from-white via-transparent to-transparent" />
                            <div className="relative z-10 flex flex-col items-center gap-8">
                                <div className="w-24 h-24 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white">
                                    <span className="material-symbols-outlined text-5xl" style={{ fontVariationSettings: "'FILL' 0, 'wght' 300" }}>
                                        barcode_scanner
                                    </span>
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-3xl font-headline font-bold tracking-tight">Ready to Analyze?</h3>
                                    <p className="text-white/80 font-body max-w-md mx-auto">
                                        Scan any product barcode or upload a label photo for an instant ingredient breakdown matched to your profile.
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowScanner(true)}
                                    className="btn-cn-primary"
                                >
                                    Start Scanning
                                </button>
                            </div>
                        </div>
                    </section>
                )}

                {/* ── Scanner Interface (revealed on click) ── */}
                {showScanner && (
                    <section className="space-y-6 animate-fade-in">
                        {/* Close scanner bar */}
                        <div className="flex items-center justify-between">
                            <h3 className="text-2xl font-headline font-bold text-cn-on-surface tracking-tight">
                                Scan Product
                            </h3>
                            <button
                                onClick={() => { setShowScanner(false); clearImage(); cam.reset(); }}
                                className="text-sm text-cn-outline hover:text-cn-primary font-medium transition-colors"
                            >
                                Close
                            </button>
                        </div>

                        {/* Barcode fallback banner */}
                        {lastFailedBarcode && (
                            <div className="flex items-center gap-2 rounded-xl bg-amber-50 px-4 py-2.5 text-sm text-amber-700 animate-fade-in">
                                <span className="material-symbols-outlined text-amber-500 text-lg">warning</span>
                                <span>
                                    Barcode <strong>{lastFailedBarcode}</strong> didn&apos;t have full data &mdash; upload a label photo to complete it.
                                </span>
                            </div>
                        )}

                        {/* ── OCR Quality Error Card ───────── */}
                        {ocrQualityInfo && !ocrQualityInfo.ok && !showManualEdit && (
                            <div className="rounded-2xl bg-amber-50 p-5 animate-fade-in">
                                <h4 className="font-headline font-bold text-amber-800 mb-2 flex items-center gap-2">
                                    <span className="material-symbols-outlined">warning</span>
                                    We couldn&apos;t read that clearly.
                                </h4>
                                <p className="text-sm text-amber-700 mb-3 font-body">Try these tips for a better scan:</p>
                                <ul className="text-sm text-amber-700 space-y-1 mb-4 ml-4 font-body">
                                    <li className="flex items-start gap-2">
                                        <span className="mt-1 w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                                        Ensure the label fills most of the frame
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="mt-1 w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                                        Avoid glare and shadows
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="mt-1 w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                                        Hold steady and let the camera focus
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="mt-1 w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                                        Good, even lighting works best
                                    </li>
                                </ul>
                                <div className="flex flex-wrap gap-3">
                                    <button onClick={handleRetakeFromError} className="btn-primary text-sm px-4 py-2">
                                        Retake photo
                                    </button>
                                    <button onClick={handleSwitchToUpload} className="btn-secondary text-sm px-4 py-2">
                                        Try another upload
                                    </button>
                                </div>
                                <button
                                    onClick={handleContinueAnyway}
                                    className="mt-3 text-xs text-amber-600 hover:text-amber-800 underline font-body"
                                >
                                    Continue anyway &rarr;
                                </button>
                            </div>
                        )}

                        {/* ── Manual edit fallback ────────── */}
                        {showManualEdit && (
                            <div className="rounded-2xl bg-cn-surface-container-lowest p-5 shadow-soft animate-fade-in">
                                <label className="block text-sm font-headline font-semibold text-cn-on-surface mb-2">
                                    Edit ingredients (optional)
                                </label>
                                <textarea
                                    value={editedText}
                                    onChange={(e) => setEditedText(e.target.value)}
                                    placeholder="Paste or edit the ingredient list here..."
                                    rows={5}
                                    className="w-full px-4 py-3 bg-cn-surface-container-low rounded-xl text-cn-on-surface placeholder-cn-outline font-body focus:outline-none focus:ring-2 focus:ring-cn-primary/20 transition-colors text-sm resize-y"
                                />
                                <div className="mt-3 flex justify-end">
                                    <button onClick={handleManualAnalyze} disabled={isLoading} className="btn-primary text-sm px-5 py-2">
                                        {isLoading ? 'Analyzing...' : 'Analyze ingredients'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* ── Upload / Camera segmented toggle ── */}
                        <div className="flex justify-center" role="tablist" aria-label="Label input mode">
                            <div className="inline-flex bg-cn-surface-container-low rounded-full p-1">
                                <button
                                    role="tab"
                                    aria-selected={labelMode === 'upload'}
                                    aria-label="Upload label photo"
                                    onClick={() => setLabelMode('upload')}
                                    className={`px-5 py-2 rounded-full text-sm font-semibold transition-all flex items-center gap-1.5 min-h-[40px] font-headline ${
                                        labelMode === 'upload'
                                            ? 'bg-gradient-to-r from-cn-primary to-cn-primary-container text-white shadow'
                                            : 'text-cn-outline hover:text-cn-primary'
                                    }`}
                                >
                                    <span className="material-symbols-outlined text-lg">upload</span>
                                    Upload
                                </button>
                                <button
                                    role="tab"
                                    aria-selected={labelMode === 'camera'}
                                    aria-label="Use camera to capture label"
                                    onClick={() => setLabelMode('camera')}
                                    className={`px-5 py-2 rounded-full text-sm font-semibold transition-all flex items-center gap-1.5 min-h-[40px] font-headline ${
                                        labelMode === 'camera'
                                            ? 'bg-gradient-to-r from-cn-primary to-cn-primary-container text-white shadow'
                                            : 'text-cn-outline hover:text-cn-primary'
                                    }`}
                                >
                                    <span className="material-symbols-outlined text-lg">photo_camera</span>
                                    Camera
                                </button>
                            </div>
                        </div>

                        {/* ── UPLOAD MODE ─────────────────── */}
                        {labelMode === 'upload' && (
                            <>
                                <div
                                    {...getRootProps()}
                                    className={`upload-zone p-10 text-center ${isDragActive ? 'active' : ''} ${previewUrl ? 'border-solid border-cn-outline-variant/30' : ''}`}
                                >
                                    <input {...getInputProps()} />
                                    {!previewUrl ? (
                                        <div>
                                            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-cn-surface-container-low flex items-center justify-center">
                                                <span className="material-symbols-outlined text-3xl text-cn-primary">upload_file</span>
                                            </div>
                                            <h3 className="text-xl font-headline font-bold mb-1 text-cn-on-surface">
                                                {isDragActive ? 'Drop here' : 'Upload Ingredient Label'}
                                            </h3>
                                            <p className="text-cn-outline text-sm font-body">
                                                Drag & drop or click &mdash; JPEG, PNG, WebP (max 10 MB)
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="animate-fade-in">
                                            <img src={previewUrl} alt="Preview" className="max-h-64 mx-auto rounded-2xl shadow-lg mb-3" />
                                            <p className="text-cn-primary font-headline font-semibold text-sm">Image ready</p>
                                        </div>
                                    )}
                                </div>

                                {previewUrl && (
                                    <div className="flex gap-4 justify-center mt-5">
                                        <button onClick={clearImage} className="btn-cn-secondary">Clear</button>
                                        <button onClick={handleImageSubmit} disabled={isLoading} className="btn-primary text-sm flex items-center gap-1">
                                            {isLoading ? 'Analyzing...' : 'Analyze Label'}
                                        </button>
                                    </div>
                                )}
                            </>
                        )}

                        {/* ── CAMERA MODE ─────────────────── */}
                        {labelMode === 'camera' && (
                            <div className="rounded-3xl bg-cn-surface-container-lowest overflow-hidden shadow-soft">
                                {/* Hidden canvas for capture */}
                                <canvas ref={cam.canvasRef} className="hidden" />

                                {/* Requesting permission */}
                                {cam.state === 'requesting-permission' && (
                                    <div className="p-10 text-center">
                                        <div className="w-12 h-12 mx-auto mb-4 rounded-full border-4 border-cn-surface-container-high border-t-cn-primary animate-spin" />
                                        <p className="text-cn-outline text-sm font-body">Requesting camera access...</p>
                                    </div>
                                )}

                                {/* Camera error */}
                                {cam.state === 'error' && (
                                    <div className="p-10 text-center">
                                        <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-red-50 flex items-center justify-center">
                                            <span className="material-symbols-outlined text-3xl text-red-500">no_photography</span>
                                        </div>
                                        <p className="text-cn-on-surface font-headline font-semibold mb-1">{cam.errorMsg}</p>
                                        <p className="text-cn-outline text-sm font-body mb-4">You can still upload a photo instead.</p>
                                        <div className="flex justify-center gap-3">
                                            <button onClick={() => cam.startCamera()} className="btn-cn-secondary">
                                                Try again
                                            </button>
                                            <button onClick={() => setLabelMode('upload')} className="btn-primary text-sm">
                                                Switch to Upload
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Live camera feed */}
                                {cam.state === 'camera-live' && (
                                    <div>
                                        <div className="relative bg-black">
                                            <video
                                                ref={cam.videoRef}
                                                autoPlay
                                                playsInline
                                                muted
                                                className="w-full max-h-80 object-cover"
                                            />
                                            <div className="absolute inset-0 pointer-events-none">
                                                <div className="absolute inset-4 border-2 border-white/30 rounded-xl" />
                                            </div>
                                        </div>
                                        <div className="p-4 flex justify-center gap-3">
                                            <button onClick={cam.capture} className="btn-primary text-sm px-6 py-2.5 flex items-center gap-2">
                                                <span className="material-symbols-outlined text-lg">camera</span>
                                                Capture
                                            </button>
                                        </div>
                                        <p className="text-center text-xs text-cn-outline pb-3 font-body">
                                            Position the ingredient label in the frame
                                        </p>
                                    </div>
                                )}

                                {/* Captured preview */}
                                {cam.state === 'captured-preview' && cam.capturedUrl && (
                                    <div>
                                        <div className="p-4">
                                            <img
                                                src={cam.capturedUrl}
                                                alt="Captured label"
                                                className="w-full max-h-72 object-contain rounded-xl"
                                            />
                                        </div>
                                        <div className="px-4 pb-4 flex justify-center gap-3">
                                            <button onClick={cam.retake} className="btn-cn-secondary">
                                                Retake
                                            </button>
                                            <button onClick={handleUsePhoto} disabled={isLoading} className="btn-primary text-sm px-5 py-2">
                                                {isLoading ? 'Analyzing...' : 'Use Photo'}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Idle state */}
                                {cam.state === 'idle' && labelMode === 'camera' && (
                                    <div className="p-10 text-center">
                                        <button onClick={cam.startCamera} className="btn-primary text-sm px-6 py-2.5">
                                            Start Camera
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ── Barcode section ─── */}
                        <div className="cn-card-low p-6 space-y-4">
                            <h3 className="text-lg font-headline font-bold text-cn-on-surface text-center">
                                Or Enter a Barcode
                            </h3>

                            <div className="flex justify-center" role="tablist" aria-label="Barcode input mode">
                                <div className="inline-flex bg-cn-surface-container rounded-full p-1">
                                    <button
                                        role="tab"
                                        aria-selected={!isCameraMode}
                                        aria-label="Enter barcode manually"
                                        onClick={() => setIsCameraMode(false)}
                                        className={`px-4 py-2 rounded-full text-sm font-semibold transition-all min-h-[40px] font-headline ${
                                            !isCameraMode
                                                ? 'bg-gradient-to-r from-cn-primary to-cn-primary-container text-white shadow'
                                                : 'text-cn-outline hover:text-cn-primary'
                                        }`}
                                    >
                                        Manual
                                    </button>
                                    <button
                                        role="tab"
                                        aria-selected={isCameraMode}
                                        aria-label="Scan barcode with camera"
                                        onClick={() => setIsCameraMode(true)}
                                        className={`px-4 py-2 rounded-full text-sm font-semibold transition-all min-h-[40px] font-headline ${
                                            isCameraMode
                                                ? 'bg-gradient-to-r from-cn-primary to-cn-primary-container text-white shadow'
                                                : 'text-cn-outline hover:text-cn-primary'
                                        }`}
                                    >
                                        Camera
                                    </button>
                                </div>
                            </div>

                            {isCameraMode ? (
                                <Scanner onScanSuccess={handleScanSuccess} onScanFailure={() => {}} />
                            ) : (
                                <form onSubmit={handleBarcodeSubmit} className="flex gap-2">
                                    <div className="flex-1 bg-cn-surface-container rounded-full flex items-center px-4 ring-1 ring-cn-outline-variant/20">
                                        <span className="material-symbols-outlined text-cn-on-surface-variant mr-3 text-lg">search</span>
                                        <input
                                            value={barcode}
                                            onChange={e => setBarcode(e.target.value)}
                                            placeholder="Enter barcode number..."
                                            aria-label="Barcode number"
                                            className="bg-transparent border-none focus:ring-0 focus:outline-none w-full py-3 text-cn-on-surface font-body placeholder-cn-outline"
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={isLoading || !barcode}
                                        aria-label="Search barcode"
                                        className="btn-primary min-w-[48px] min-h-[48px] px-5 py-3 disabled:opacity-40 flex items-center justify-center rounded-full"
                                    >
                                        <span className="material-symbols-outlined">search</span>
                                    </button>
                                </form>
                            )}
                        </div>
                    </section>
                )}

                {/* ── Nutrition Tip of the Day ── */}
                <section className="pb-12 animate-slide-up">
                    <div className="bg-cn-surface-container-low rounded-3xl p-8 flex flex-col md:flex-row items-center gap-8">
                        <div className="w-20 h-20 shrink-0 bg-cn-secondary-container text-cn-on-secondary-container rounded-2xl flex items-center justify-center">
                            <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>lightbulb</span>
                        </div>
                        <div className="space-y-2 text-center md:text-left">
                            <h3 className="text-xl font-headline font-bold text-cn-on-surface">Nutrition Tip of the Day</h3>
                            <p className="text-cn-on-surface-variant font-body leading-relaxed max-w-2xl">
                                Ingredients are listed by weight from highest to lowest. If sugar or high-fructose corn syrup is in the top three, the product is likely high in added sugars.
                            </p>
                        </div>
                        <div className="md:ml-auto">
                            <button
                                onClick={onNavigateHowTo}
                                className="btn-cn-secondary"
                            >
                                Learn More
                            </button>
                        </div>
                    </div>
                </section>

                {/* ── Feature highlights ── */}
                <section className="grid sm:grid-cols-3 gap-6 pb-8">
                    {[
                        {
                            title: 'AI Analysis',
                            desc: 'Groq-powered ingredient parsing & evidence lookup',
                            icon: 'biotech',
                        },
                        {
                            title: 'Conflict Detection',
                            desc: 'Allergy, diet & caffeine flags tailored to you',
                            icon: 'verified_user',
                        },
                        {
                            title: 'Product Chat',
                            desc: 'Ask follow-up questions about any ingredient',
                            icon: 'chat',
                        },
                    ].map((f, i) => (
                        <div key={i} className="cn-card p-6 text-center hover:translate-y-[-4px] transition-transform">
                            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-cn-surface-container-low flex items-center justify-center">
                                <span className="material-symbols-outlined text-2xl text-cn-primary">{f.icon}</span>
                            </div>
                            <h4 className="font-headline font-bold text-sm mb-1 text-cn-on-surface">{f.title}</h4>
                            <p className="text-cn-outline text-xs font-body">{f.desc}</p>
                        </div>
                    ))}
                </section>
            </div>
        </div>
    );
};

export default ScanPage;
