import React, { useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShareAlt, faCopy, faCheck } from '@fortawesome/free-solid-svg-icons';
import { faWhatsapp, faTwitter, faFacebookF } from '@fortawesome/free-brands-svg-icons';

interface ShareMenuProps {
    url: string;
    title: string;
    onShareSuccess?: () => void;
    sharesCount?: number;
}

const ShareMenu: React.FC<ShareMenuProps> = ({ url, title, onShareSuccess, sharesCount }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [copied, setCopied] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleNativeShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({ title, url });
                onShareSuccess?.();
                setIsOpen(false);
            } catch (err) {
                if ((err as Error).name !== 'AbortError') {
                    console.error('Error sharing:', err);
                }
            }
        } else {
            setIsOpen(!isOpen);
        }
    };

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            onShareSuccess?.();
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const shareLinks = [
        {
            name: 'WhatsApp',
            icon: <FontAwesomeIcon icon={faWhatsapp} className="w-4 h-4 text-gray-400" />,
            url: `https://wa.me/?text=${encodeURIComponent(title + ' ' + url)}`,
        },
        {
            name: 'X (Twitter)',
            icon: <FontAwesomeIcon icon={faTwitter} className="w-4 h-4 text-white" />,
            url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
        },
        {
            name: 'Facebook',
            icon: <FontAwesomeIcon icon={faFacebookF} className="w-4 h-4 text-gray-400" />,
            url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
        },
    ];

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    handleNativeShare();
                }}
                className="flex items-center space-x-1.5 p-1.5 sm:p-2 text-gray-500 hover:text-white hover:bg-gray-800/50 rounded-xl transition-all"
            >
                <FontAwesomeIcon icon={faShareAlt} className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                {sharesCount !== undefined && sharesCount > 0 && (
                    <span className="text-[10px] sm:text-xs font-bold">{sharesCount}</span>
                )}
            </button>

            {isOpen && (
                <div className="absolute bottom-full right-0 mb-2 w-48 bg-gray-900 border border-gray-800 rounded-2xl shadow-apple-lg p-2 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
                    <div className="space-y-1">
                        {shareLinks.map((link) => (
                            <a
                                key={link.name}
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onShareSuccess?.();
                                    setIsOpen(false);
                                }}
                                className="flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-medium text-gray-400 hover:text-white hover:bg-gray-800/50 transition-colors"
                            >
                                {link.icon}
                                <span>{link.name}</span>
                            </a>
                        ))}
                        <div className="h-[1px] bg-gray-800 my-1 mx-2" />
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                copyToClipboard();
                            }}
                            className="w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-medium text-gray-400 hover:text-white hover:bg-gray-800/50 transition-colors"
                        >
                            {copied ? (
                                <FontAwesomeIcon icon={faCheck} className="w-4 h-4 text-white" />
                            ) : (
                                <FontAwesomeIcon icon={faCopy} className="w-4 h-4 text-gray-400" />
                            )}
                            <span>{copied ? 'Copied!' : 'Copy Link'}</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ShareMenu;
