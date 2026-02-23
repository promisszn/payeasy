import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';

export type DropdownPlacement =
    | 'bottom-start' | 'bottom-end' | 'bottom-center'
    | 'top-start' | 'top-end' | 'top-center'
    | 'left-start' | 'left-end' | 'left-center'
    | 'right-start' | 'right-end' | 'right-center';

export interface DropdownContextType {
    isOpen: boolean;
    setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
    triggerRef: React.RefObject<HTMLButtonElement>;
    panelId: string;
    placement: DropdownPlacement;
    offset: number;
}

const DropdownContext = createContext<DropdownContextType | undefined>(undefined);

export const useDropdownContext = () => {
    const context = useContext(DropdownContext);
    if (!context) {
        throw new Error('Dropdown components must be used within a Dropdown provider');
    }
    return context;
};

export interface DropdownProps {
    children: React.ReactNode;
    placement?: DropdownPlacement;
    offset?: number;
    defaultOpen?: boolean;
    onOpenChange?: (isOpen: boolean) => void;
}

export function Dropdown({
    children,
    placement = 'bottom-start',
    offset = 4,
    defaultOpen = false,
    onOpenChange,
}: DropdownProps) {
    const [isOpen, setIsOpenState] = useState(defaultOpen);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const panelId = React.useId();

    const setIsOpen = useCallback((val: boolean | ((prevState: boolean) => boolean)) => {
        setIsOpenState((prev) => {
            const next = typeof val === 'function' ? val(prev) : val;
            if (prev !== next && onOpenChange) {
                onOpenChange(next);
            }
            return next;
        });
    }, [onOpenChange]);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (isOpen && e.key === 'Escape') {
                setIsOpen(false);
                triggerRef.current?.focus();
            }
            // Tab closes and moves focus
            if (isOpen && e.key === 'Tab') {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            return () => document.removeEventListener('keydown', handleEscape);
        }
    }, [isOpen, setIsOpen]);

    useEffect(() => {
        // External Click outside handling
        const handleClickOutside = (e: MouseEvent) => {
            if (!isOpen) return;

            const target = e.target as Node;
            const trigger = triggerRef.current;
            const panel = document.getElementById(panelId);

            if (
                trigger && trigger.contains(target) ||
                panel && panel.contains(target)
            ) {
                return;
            }

            setIsOpen(false);
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [isOpen, panelId, setIsOpen]);

    return (
        <DropdownContext.Provider value={{ isOpen, setIsOpen, triggerRef, panelId, placement, offset }}>
            <div className="relative inline-block text-left">
                {children}
            </div>
        </DropdownContext.Provider>
    );
}

export interface DropdownTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    asChild?: boolean;
    children: React.ReactNode;
}

export function DropdownTrigger({ children, className = '', ...props }: DropdownTriggerProps) {
    const { isOpen, setIsOpen, triggerRef, panelId } = useDropdownContext();

    const handleClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
        props.onClick?.(e);
        if (!e.defaultPrevented) {
            setIsOpen((prev) => !prev);
        }
    }, [props.onClick, setIsOpen]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLButtonElement>) => {
        props.onKeyDown?.(e);
        if (!e.defaultPrevented && (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown')) {
            e.preventDefault();
            setIsOpen(true);
        }
    }, [props.onKeyDown, setIsOpen]);

    return (
        <button
            ref={triggerRef}
            type="button"
            aria-haspopup="menu"
            aria-expanded={isOpen}
            aria-controls={isOpen ? panelId : undefined}
            onClick={handleClick}
            onKeyDown={handleKeyDown}
            className={`inline-flex items-center justify-center ${className}`}
            {...props}
        >
            {children}
        </button>
    );
}

function getPositionStyles(
    triggerRect: DOMRect,
    panelRect: DOMRect,
    placement: DropdownPlacement,
    offset: number
): React.CSSProperties {
    let top = 0;
    let left = 0;

    const scrollY = window.scrollY || window.pageYOffset;
    const scrollX = window.scrollX || window.pageXOffset;

    // Base positioning
    switch (placement) {
        case 'bottom-start':
        case 'bottom-center':
        case 'bottom-end':
            top = triggerRect.bottom + scrollY + offset;
            break;
        case 'top-start':
        case 'top-center':
        case 'top-end':
            top = triggerRect.top + scrollY - panelRect.height - offset;
            break;
        case 'left-start':
        case 'left-center':
        case 'left-end':
            left = triggerRect.left + scrollX - panelRect.width - offset;
            break;
        case 'right-start':
        case 'right-center':
        case 'right-end':
            left = triggerRect.right + scrollX + offset;
            break;
    }

    // Alignment
    if (placement.startsWith('top') || placement.startsWith('bottom')) {
        if (placement.endsWith('start')) {
            left = triggerRect.left + scrollX;
        } else if (placement.endsWith('center')) {
            left = triggerRect.left + scrollX + (triggerRect.width / 2) - (panelRect.width / 2);
        } else if (placement.endsWith('end')) {
            left = triggerRect.right + scrollX - panelRect.width;
        }
    } else {
        if (placement.endsWith('start')) {
            top = triggerRect.top + scrollY;
        } else if (placement.endsWith('center')) {
            top = triggerRect.top + scrollY + (triggerRect.height / 2) - (panelRect.height / 2);
        } else if (placement.endsWith('end')) {
            top = triggerRect.bottom + scrollY - panelRect.height;
        }
    }

    // Quick Boundary Check (Push back onto screen if clipped) - simplified collision
    const windowWidth = document.documentElement.clientWidth;
    if (left < 0) left = offset;
    if (left + panelRect.width > windowWidth) left = windowWidth - panelRect.width - offset;

    return {
        position: 'absolute',
        top: `${top}px`,
        left: `${left}px`,
        minWidth: 'max-content',
    };
}

export interface DropdownPanelProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
}

export function DropdownPanel({ children, className = '', ...props }: DropdownPanelProps) {
    const { isOpen, setIsOpen, triggerRef, panelId, placement, offset } = useDropdownContext();
    const panelRef = useRef<HTMLDivElement>(null);
    const [styles, setStyles] = useState<React.CSSProperties>({ visibility: 'hidden' });
    const [isRendered, setIsRendered] = useState(false);

    // Render Portal slightly earlier for transform transitions
    useEffect(() => {
        let timeoutId: NodeJS.Timeout;
        if (isOpen) {
            setIsRendered(true);
        } else {
            timeoutId = setTimeout(() => setIsRendered(false), 200); // Wait for transition
        }
        return () => clearTimeout(timeoutId);
    }, [isOpen]);

    const updatePosition = useCallback(() => {
        if (!triggerRef.current || !panelRef.current) return;
        const triggerRect = triggerRef.current.getBoundingClientRect();
        const panelRect = panelRef.current.getBoundingClientRect();

        setStyles(getPositionStyles(triggerRect, panelRect, placement, offset));
    }, [triggerRef, placement, offset]);

    useEffect(() => {
        if (isOpen && isRendered) {
            // double requestAF to render first then get height
            requestAnimationFrame(() => requestAnimationFrame(updatePosition));
            window.addEventListener('resize', updatePosition);
            window.addEventListener('scroll', updatePosition, true);
        }
        return () => {
            window.removeEventListener('resize', updatePosition);
            window.removeEventListener('scroll', updatePosition, true);
        };
    }, [isOpen, isRendered, updatePosition]);

    // Keyboard navigation within panel
    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
        if (!panelRef.current) return;

        const items = Array.from(
            panelRef.current.querySelectorAll('[role="menuitem"]:not([disabled])')
        ) as HTMLElement[];

        // Handle ArrowKeys
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            e.preventDefault();
            const currentIndex = items.indexOf(document.activeElement as HTMLElement);
            let nextIndex = currentIndex;

            if (e.key === 'ArrowDown') {
                nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
            } else if (e.key === 'ArrowUp') {
                nextIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
            }

            items[nextIndex]?.focus();
        }

        // Home / End
        if (e.key === 'Home') {
            e.preventDefault();
            items[0]?.focus();
        } else if (e.key === 'End') {
            e.preventDefault();
            items[items.length - 1]?.focus();
        }
    }, []);

    // Initial focus on open
    useEffect(() => {
        if (isOpen && panelRef.current && styles.visibility !== 'hidden') {
            const firstItem = panelRef.current.querySelector('[role="menuitem"]:not([disabled])') as HTMLElement;
            // push to back of queue so layout happens first
            setTimeout(() => firstItem?.focus(), 10);
        }
    }, [isOpen, styles.visibility]);


    if (!isRendered && typeof document !== 'undefined') return null;

    // Only render to portal if document is present (client side)
    if (typeof document === 'undefined') return <>{children}</>;

    return createPortal(
        <div
            id={panelId}
            ref={panelRef}
            role="menu"
            aria-orientation="vertical"
            aria-labelledby={triggerRef.current?.id}
            tabIndex={-1}
            onKeyDown={handleKeyDown}
            style={{ ...styles, zIndex: 9999 }}
            className={`
                bg-slate-900 border border-slate-700/60 shadow-xl rounded-xl ring-1 ring-black ring-opacity-5 overflow-hidden
                transform origin-top transition-all duration-200 ease-out outline-none
                ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}
                ${className}
            `}
            {...props}
        >
            {children}
        </div>,
        document.body
    );
}
