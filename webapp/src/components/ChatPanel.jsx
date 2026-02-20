import { useState, useRef, useEffect } from 'react';
import { chat } from '../services/api';

const ChatPanel = ({ sessionId, productName }) => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const bottomRef = useRef(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async () => {
        const text = input.trim();
        if (!text || loading) return;

        const userMsg = { role: 'user', content: text };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            const history = messages.map(m => ({ role: m.role, content: m.content }));
            const res = await chat(sessionId, text, history);
            const assistantMsg = {
                role: 'assistant',
                content: res.answer,
                citations: res.citations_used || [],
            };
            setMessages(prev => [...prev, assistantMsg]);
        } catch (err) {
            setMessages(prev => [
                ...prev,
                { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-primary-500 to-accent-500 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg hover:shadow-glow transition-all text-2xl"
                title="Chat about this product"
            >
                💬
            </button>
        );
    }

    return (
        <div className="fixed bottom-6 right-6 z-50 w-96 max-h-[32rem] flex flex-col glass-strong shadow-2xl rounded-2xl overflow-hidden animate-slide-up">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-primary-600 to-accent-600">
                <div>
                    <h3 className="text-white font-bold text-sm">LabelLens Chat</h3>
                    <p className="text-white/70 text-xs truncate max-w-[14rem]">{productName || 'Current product'}</p>
                </div>
                <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white text-lg">✕</button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar min-h-[12rem]">
                {messages.length === 0 && (
                    <p className="text-gray-400 text-sm text-center mt-8">
                        Ask anything about this product's ingredients.
                    </p>
                )}
                {messages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div
                            className={`max-w-[80%] rounded-xl px-3 py-2 text-sm whitespace-pre-wrap ${
                                m.role === 'user'
                                    ? 'bg-primary-600 text-white'
                                    : 'bg-white/10 text-gray-200'
                            }`}
                        >
                            {m.content}
                        </div>
                    </div>
                ))}
                {loading && (
                    <div className="flex justify-start">
                        <div className="bg-white/10 rounded-xl px-3 py-2 text-sm text-gray-400 animate-pulse">
                            Thinking…
                        </div>
                    </div>
                )}
                <div ref={bottomRef} />
            </div>

            {/* Disclaimer */}
            <p className="text-[10px] text-gray-500 text-center px-2">Educational only; not medical advice.</p>

            {/* Input */}
            <div className="flex items-center gap-2 p-2 border-t border-white/10">
                <input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask about this product…"
                    className="flex-1 px-3 py-2 text-sm bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
                    disabled={loading}
                />
                <button
                    onClick={handleSend}
                    disabled={loading || !input.trim()}
                    className="px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-semibold disabled:opacity-40 transition-colors"
                >
                    ➤
                </button>
            </div>
        </div>
    );
};

export default ChatPanel;
