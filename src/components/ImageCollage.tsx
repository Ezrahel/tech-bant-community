import React from 'react';
import { MediaAttachment } from '../types';

interface ImageCollageProps {
    media: MediaAttachment[];
    onImageClick?: (index: number) => void;
}

const ImageCollage: React.FC<ImageCollageProps> = ({ media, onImageClick }) => {
    if (!media || media.length === 0) return null;

    const count = media.length;
    const images = media.slice(0, 4);
    const remainingCount = count - 4;

    const renderImage = (img: MediaAttachment, index: number, className: string) => (
        <div
            key={img.id}
            onClick={(e) => {
                e.stopPropagation();
                onImageClick?.(index);
            }}
            className={`relative cursor-pointer overflow-hidden group ${className}`}
        >
            {img.type === 'video' ? (
                <div className="w-full h-full bg-black flex items-center justify-center">
                    <video src={img.url} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors">
                        <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                            <div className="w-0 h-0 border-t-[8px] border-t-transparent border-l-[12px] border-l-white border-b-[8px] border-b-transparent ml-1" />
                        </div>
                    </div>
                </div>
            ) : (
                <img
                    src={img.url}
                    alt={img.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
            )}

            {index === 3 && remainingCount > 0 && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center">
                    <span className="text-white text-2xl sm:text-3xl font-bold">+{remainingCount}</span>
                </div>
            )}
            <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
    );

    return (
        <div className="rounded-2xl overflow-hidden border border-gray-800/50 bg-gray-900/40 backdrop-blur-sm">
            {count === 1 && (
                <div className="aspect-video w-full">
                    {renderImage(media[0], 0, "w-full h-full")}
                </div>
            )}

            {count === 2 && (
                <div className="grid grid-cols-2 gap-0.5 aspect-[4/3] sm:aspect-video w-full">
                    {renderImage(media[0], 0, "h-full")}
                    {renderImage(media[1], 1, "h-full")}
                </div>
            )}

            {count === 3 && (
                <div className="grid grid-cols-2 grid-rows-2 gap-0.5 aspect-[4/3] sm:aspect-video w-full">
                    {renderImage(media[0], 0, "row-span-2 h-full")}
                    {renderImage(media[1], 1, "h-full")}
                    {renderImage(media[2], 2, "h-full")}
                </div>
            )}

            {count >= 4 && (
                <div className="grid grid-cols-2 grid-rows-2 gap-0.5 aspect-[4/3] sm:aspect-video w-full">
                    {renderImage(media[0], 0, "h-full")}
                    {renderImage(media[1], 1, "h-full")}
                    {renderImage(media[2], 2, "h-full")}
                    {renderImage(media[3], 3, "h-full")}
                </div>
            )}
        </div>
    );
};

export default ImageCollage;
