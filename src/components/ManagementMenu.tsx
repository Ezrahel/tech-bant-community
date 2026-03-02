import React, { useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEllipsisH, faEdit, faTrashAlt, faFlag, faExclamationCircle } from '@fortawesome/free-solid-svg-icons';

interface ManagementMenuProps {
    isOwner: boolean;
    isAdmin: boolean;
    onEdit: () => void;
    onDelete: () => void;
    onReport?: () => void;
}

const ManagementMenu: React.FC<ManagementMenuProps> = ({ isOwner, isAdmin, onEdit, onDelete, onReport }) => {
    const [isOpen, setIsOpen] = useState(false);
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

    const canManage = isOwner || isAdmin;

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(!isOpen);
                }}
                className="p-1.5 sm:p-2 text-gray-500 hover:text-white hover:bg-gray-800/50 rounded-xl transition-all"
            >
                <FontAwesomeIcon icon={faEllipsisH} className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>

            {isOpen && (
                <div className="absolute bottom-full right-0 mb-2 w-48 bg-gray-900 border border-gray-800 rounded-2xl shadow-apple-lg p-2 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
                    <div className="space-y-1">
                        {canManage && (
                            <>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setIsOpen(false);
                                        onEdit();
                                    }}
                                    className="w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-medium text-gray-400 hover:text-white hover:bg-gray-800/50 transition-colors"
                                >
                                    <FontAwesomeIcon icon={faEdit} className="w-4 h-4 text-gray-400" />
                                    <span>Edit</span>
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setIsOpen(false);
                                        if (window.confirm('Are you sure you want to delete this?')) {
                                            onDelete();
                                        }
                                    }}
                                    className="w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-medium text-gray-400 hover:text-white hover:bg-gray-800/50 transition-colors"
                                >
                                    <FontAwesomeIcon icon={faTrashAlt} className="w-4 h-4" />
                                    <span>Delete</span>
                                </button>
                                <div className="h-[1px] bg-gray-800 my-1 mx-2" />
                            </>
                        )}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsOpen(false);
                                onReport?.();
                            }}
                            className="w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-medium text-gray-400 hover:text-white hover:bg-gray-800/50 transition-colors"
                        >
                            <FontAwesomeIcon icon={faFlag} className="w-4 h-4" />
                            <span>Report</span>
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsOpen(false);
                            }}
                            className="w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-medium text-gray-400 hover:text-white hover:bg-gray-800/50 transition-colors"
                        >
                            <FontAwesomeIcon icon={faExclamationCircle} className="w-4 h-4" />
                            <span>Block User</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManagementMenu;
