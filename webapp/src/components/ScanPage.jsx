import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import Scanner from './Scanner';

const ScanPage = ({ onScanResult, isLoading, lastFailedBarcode = '' }) => {
    const [barcode, setBarcode] = useState('');
    const [isCameraMode, setIsCameraMode] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);

    // ── User profile state ─────────────────────
    const [showProfile, setShowProfile] = useState(false);
    const [profile, setProfile] = useState({
        vegan: false,
        vegetarian: false,
        halal: false,
        allergies: '',
        caffeine_limit_mg: '',
        avoid_terms: '',
    });

    const buildProfilePayload = () => ({
        vegan: profile.vegan,
        vegetarian: profile.vegetarian,
        halal: profile.halal,
        allergies: profile.allergies
            ? profile.allergies.split(',').map(s => s.trim()).filter(Boolean)
            : [],
        caffeine_limit_mg: profile.caffeine_limit_mg ? Number(profile.caffeine_limit_mg) : null,
        avoid_terms: profile.avoid_terms
            ? profile.avoid_terms.split(',').map(s => s.trim()).filter(Boolean)
            : [],
    });

    // ── Barcode submit ─────────────────────────
    const handleBarcodeSubmit = (e) => {
        e?.preventDefault();
        if (!barcode.trim()) return;
        onScanResult({ type: 'barcode', barcode: barcode.trim(), userProfile: buildProfilePayload() });
    };

    const handleScanSuccess = (decodedText) => {
        setBarcode(decodedText);
        setIsCameraMode(false);
        onScanResult({ type: 'barcode', barcode: decodedText, userProfile: buildProfilePayload() });
    };

    // ── Image upload ───────────────────────────
    const onDrop = useCallback((files) => {
        const file = files[0];
        if (!file) return;
        setSelectedImage(file);
        setPreviewUrl(URL.createObjectURL(file));
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] },
        maxFiles: 1,
    });

    const handleImageSubmit = () => {
        if (!selectedImage) return;
        onScanResult({
            type: 'label',
            imageFile: selectedImage,
            barcode: lastFailedBarcode,   // forward barcode so backend can cache
            userProfile: buildProfilePayload(),
        });
    };

    const clearImage = () => {
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setSelectedImage(null);
        setPreviewUrl(null);
    };

    // ── Toggle helper ──────────────────────────
    const Toggle = ({ label, checked, onChange }) => (
        <label className="flex items-center gap-2 cursor-pointer">
            <div
                className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors ${checked ? 'bg-indigo-500' : 'bg-gray-200'}`}
                onClick={onChange}
            >
                <div className={`bg-white w-4 h-4 rounded-full shadow transition-transform ${checked ? 'translate-x-4' : ''}`} />
            </div>
            <span className="text-sm text-gray-600">{label}</span>
        </label>
    );

    return (
        <div className="min-h-screen bg-[#f5f7fb] text-gray-800">
            <div className="mx-auto max-w-2xl px-4 py-14">

                {/* Hero */}
                <div className="text-center mb-12 animate-fade-in">
                    <h1 className="text-5xl sm:text-6xl font-display font-extrabold mb-3 gradient-text leading-tight">
                        LabelLens
                    </h1>
                    <p className="text-lg text-gray-600">Scan. Understand. Decide.</p>
                    <p className="text-gray-400 text-sm mt-1">
                        Scan a barcode or upload a label photo to get personalized ingredient insights.
                    </p>
                </div>

                {/* Preferences toggle */}
                <div className="mb-8 animate-slide-up">
                    <button
                        onClick={() => setShowProfile(p => !p)}
                        className="w-full text-left glass-strong px-5 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                    >
                        <span className="text-gray-700 font-semibold text-sm">My Preferences</span>
                        <span className="text-gray-400 text-xs">{showProfile ? '▲' : '▼'}</span>
                    </button>
                    {showProfile && (
                        <div className="glass p-5 mt-2 space-y-4 animate-fade-in">
                            <div className="flex flex-wrap gap-6">
                                <Toggle label="Vegan" checked={profile.vegan} onChange={() => setProfile(p => ({ ...p, vegan: !p.vegan }))} />
                                <Toggle label="Vegetarian" checked={profile.vegetarian} onChange={() => setProfile(p => ({ ...p, vegetarian: !p.vegetarian }))} />
                                <Toggle label="Halal" checked={profile.halal} onChange={() => setProfile(p => ({ ...p, halal: !p.halal }))} />
                            </div>
                            <input
                                value={profile.allergies}
                                onChange={e => setProfile(p => ({ ...p, allergies: e.target.value }))}
                                placeholder="Allergies (comma-separated, e.g. peanuts, milk)"
                                className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:border-indigo-400 transition-colors"
                            />
                            <input
                                value={profile.caffeine_limit_mg}
                                onChange={e => setProfile(p => ({ ...p, caffeine_limit_mg: e.target.value }))}
                                placeholder="Caffeine limit (mg, optional)"
                                type="number"
                                className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:border-indigo-400 transition-colors"
                            />
                            <input
                                value={profile.avoid_terms}
                                onChange={e => setProfile(p => ({ ...p, avoid_terms: e.target.value }))}
                                placeholder="Avoid terms (comma-separated, e.g. palm oil, MSG)"
                                className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:border-indigo-400 transition-colors"
                            />
                        </div>
                    )}
                </div>

                {/* ── Primary action: Upload label photo ─── */}
                <div className="animate-slide-up mb-6">
                    {/* Barcode fallback banner */}
                    {lastFailedBarcode && (
                        <div className="mb-3 flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200 px-4 py-2.5 text-sm text-amber-700 animate-fade-in">
                            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                            </svg>
                            <span>
                                Barcode <strong>{lastFailedBarcode}</strong> didn&apos;t have full data &mdash; upload a label photo to complete it.
                            </span>
                        </div>
                    )}
                    <div
                        {...getRootProps()}
                        className={`upload-zone p-10 text-center ${isDragActive ? 'active' : ''} ${previewUrl ? 'border-solid border-indigo-200' : ''}`}
                    >
                        <input {...getInputProps()} />
                        {!previewUrl ? (
                            <div>
                                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-indigo-50 flex items-center justify-center">
                                    <svg className="w-8 h-8 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-bold mb-1 text-gray-800">
                                    {isDragActive ? 'Drop here' : 'Upload Ingredient Label'}
                                </h3>
                                <p className="text-gray-400 text-sm">
                                    Drag & drop or click -- JPEG, PNG, WebP (max 10 MB)
                                </p>
                            </div>
                        ) : (
                            <div className="animate-fade-in">
                                <img src={previewUrl} alt="Preview" className="max-h-64 mx-auto rounded-2xl shadow-lg mb-3 border border-gray-100" />
                                <p className="text-emerald-600 font-semibold text-sm">Image ready</p>
                            </div>
                        )}
                    </div>

                    {previewUrl && (
                        <div className="flex gap-4 justify-center mt-5">
                            <button onClick={clearImage} className="btn-secondary text-sm">Clear</button>
                            <button onClick={handleImageSubmit} disabled={isLoading} className="btn-primary text-sm flex items-center gap-1">
                                {isLoading ? 'Analyzing...' : 'Analyze Label'}
                            </button>
                        </div>
                    )}
                </div>

                {/* Divider */}
                <div className="flex items-center gap-4 mb-6">
                    <div className="flex-1 h-px bg-gray-200" />
                    <span className="text-gray-400 text-xs uppercase tracking-wider">or scan a barcode</span>
                    <div className="flex-1 h-px bg-gray-200" />
                </div>

                {/* ── Secondary action: Barcode scan ────── */}
                <div className="glass-strong p-6 mb-10 animate-slide-up">
                    <h3 className="text-lg font-semibold mb-4 text-gray-700 text-center">Scan or Enter Barcode</h3>

                    {/* Segmented control */}
                    <div className="flex justify-center mb-5">
                        <div className="inline-flex bg-gray-100 rounded-full p-1">
                            <button
                                onClick={() => setIsCameraMode(false)}
                                className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
                                    !isCameraMode ? 'bg-indigo-500 text-white shadow' : 'text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                Manual
                            </button>
                            <button
                                onClick={() => setIsCameraMode(true)}
                                className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
                                    isCameraMode ? 'bg-indigo-500 text-white shadow' : 'text-gray-500 hover:text-gray-700'
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
                            <input
                                value={barcode}
                                onChange={e => setBarcode(e.target.value)}
                                placeholder="Enter barcode number..."
                                className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-gray-800 placeholder-gray-400 focus:outline-none focus:border-indigo-400 transition-colors"
                            />
                            <button
                                type="submit"
                                disabled={isLoading || !barcode}
                                className="btn-primary px-5 py-3 disabled:opacity-40"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                                </svg>
                            </button>
                        </form>
                    )}
                </div>

                {/* Feature cards */}
                <div className="grid sm:grid-cols-3 gap-4 mt-8">
                    {[
                        {
                            title: 'AI Analysis',
                            desc: 'Groq-powered ingredient parsing & evidence lookup',
                            color: 'bg-indigo-50 text-indigo-600',
                            icon: (
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
                                </svg>
                            ),
                        },
                        {
                            title: 'Conflict Detection',
                            desc: 'Allergy, diet & caffeine flags tailored to you',
                            color: 'bg-emerald-50 text-emerald-600',
                            icon: (
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                                </svg>
                            ),
                        },
                        {
                            title: 'Product Chat',
                            desc: 'Ask follow-up questions about any ingredient',
                            color: 'bg-amber-50 text-amber-600',
                            icon: (
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                                </svg>
                            ),
                        },
                    ].map((f, i) => (
                        <div key={i} className="glass-strong p-5 text-center hover:shadow-card-hover transition-all">
                            <div className={`w-12 h-12 mx-auto mb-3 rounded-2xl flex items-center justify-center ${f.color}`}>
                                {f.icon}
                            </div>
                            <h4 className="font-bold text-sm mb-1 text-gray-800">{f.title}</h4>
                            <p className="text-gray-400 text-xs">{f.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ScanPage;
