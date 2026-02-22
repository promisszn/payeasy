import React, { createContext, useContext, KeyboardEvent } from 'react';
import { useDropdownContext } from './Dropdown';

export interface MenuProps {
    children: React.ReactNode;
    className?: string;
    variant?: 'default' | 'compact';
}

const MenuContext = createContext<{ variant: 'default' | 'compact' }>({ variant: 'default' });

export function Menu({ children, className = '', variant = 'default' }: MenuProps) {
    return (
        <MenuContext.Provider value={{ variant }}>
            <div
                className={`flex flex-col py-1 ${variant === 'compact' ? 'px-1 space-y-[2px]' : 'w-56'
                    } ${className}`}
            >
                {children}
            </div>
        </MenuContext.Provider>
    );
}

export interface MenuItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    icon?: React.ReactNode;
    danger?: boolean;
    asChild?: boolean;
    children: React.ReactNode;
}

export function MenuItem({ children, icon, danger, className = '', ...props }: MenuItemProps) {
    const { setIsOpen, triggerRef } = useDropdownContext();
    const { variant } = useContext(MenuContext);

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        // Prevent default behavior to allow proper close & focus routing
        // but only if not otherwise handled
        if (props.onClick) {
            props.onClick(e);
        }

        if (!e.defaultPrevented) {
            setIsOpen(false);
            triggerRef.current?.focus();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
        if (props.onKeyDown) {
            props.onKeyDown(e);
        }

        if (!e.defaultPrevented && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            setIsOpen(false);
            props.onClick?.(e as unknown as React.MouseEvent<HTMLButtonElement>);
            triggerRef.current?.focus();
        }
    };

    const baseClasses = `
        w-full text-left flex items-center outline-none
        transition-colors duration-150 ease-in-out cursor-pointer select-none
    `;

    // Define state styles outside
    let stateStyles = '';
    if (danger) {
        stateStyles = 'text-red-400 focus:bg-red-500/10 hover:bg-red-500/10';
    } else {
        stateStyles = 'text-slate-200 focus:bg-indigo-500/10 focus:text-indigo-400 hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed';
    }

    const sizeStyles = variant === 'compact'
        ? 'px-2 py-1.5 text-xs rounded-md mx-1 w-[calc(100%-8px)]'
        : 'px-4 py-2 text-sm';

    // Support custom render slot
    if (props.asChild) {
        return <div onClick={handleClick as unknown as React.MouseEventHandler<HTMLDivElement>} onKeyDown={handleKeyDown as unknown as React.KeyboardEventHandler<HTMLDivElement>}>{children}</div>;
    }

    return (
        <button
            type="button"
            role="menuitem"
            tabIndex={-1}
            disabled={props.disabled}
            onClick={handleClick}
            onKeyDown={handleKeyDown}
            className={`${baseClasses} ${stateStyles} ${sizeStyles} ${className}`}
            {...props}
        >
            {icon && (
                <span className={`mr-2 flex-shrink-0 ${danger ? 'text-red-400' : 'text-slate-400'}`}>
                    {icon}
                </span>
            )}
            <span className="flex-grow truncate">{children}</span>
        </button>
    );
}

export function MenuSeparator() {
    return <div className="h-px bg-slate-700/50 my-1 w-full" role="separator" />;
}

export function MenuLabel({ children }: { children: React.ReactNode }) {
    const { variant } = useContext(MenuContext);
    const sizeStyles = variant === 'compact' ? 'px-3 py-1 text-[10px]' : 'px-4 py-1.5 text-xs';

    return (
        <div className={`font-semibold text-slate-500 tracking-wider uppercase ${sizeStyles}`}>
            {children}
        </div>
    );
}
