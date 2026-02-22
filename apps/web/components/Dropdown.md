# Dropdown & Menu Component

A polished, fully accessible dropdown and menu component system with multiple variants, portal rendering, focus management, click-outside handling, and smooth animations fully compliant with keyboard navigation specs.

## Components Breakdown

The system breaks down into two core groups: Base `Dropdown` components and child `Menu` primitives.

### Dropdown, DropdownTrigger, & DropdownPanel

The main orchestrators.
- `Dropdown`: Standard context root. Controls `isOpen` states, positioning definitions, and handles the `Escape/click-outside` logic directly mapped to root.
- `DropdownTrigger`: Renders a button that strictly handles toggling focus logic mapped to `aria-expanded` and `aria-haspopup`.
- `DropdownPanel`: Renders the portal body using `createPortal`. Calculates window bounds dynamically per-resize and clamps offset positioning.

### Menu, MenuItem, MenuSeparator & MenuLabel 

The structure.
- `Menu`: Takes a `variant` prop (`default | compact`) implicitly enforcing sizing guidelines downwards.
- `MenuItem`: Extends a button node taking `icon` and `danger` props modifying Tailwind styles heavily to standard interactive standards perfectly synced with full arrow-key down/up layouts inherently managed by `DropdownPanel`.
- `MenuLabel` / `MenuSeparator`: Semantic render dividers providing non-focusable organizational separators.

## Props Interfaces

### Dropdown Prop Signatures

```ts
export type DropdownPlacement = 
    | 'bottom-start' | 'bottom-end' | 'bottom-center'
    | 'top-start' | 'top-end' | 'top-center'
    | 'left-start' | 'left-end' | 'left-center'
    | 'right-start' | 'right-end' | 'right-center';

export interface DropdownProps {
    children: React.ReactNode;
    placement?: DropdownPlacement; // default: 'bottom-start'
    offset?: number;               // default: 4 (px)
    defaultOpen?: boolean;         
    onOpenChange?: (isOpen: boolean) => void;
}
```

### Menu & MenuItem Signatures

```ts
export interface MenuProps {
    children: React.ReactNode;
    className?: string;
    variant?: 'default' | 'compact'; // default: 'default'
}

export interface MenuItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    icon?: React.ReactNode;
    danger?: boolean;
    children: React.ReactNode;
}
```

## Basic Usage

```tsx
import { Dropdown, DropdownTrigger, DropdownPanel } from "@/components/Dropdown";
import { Menu, MenuItem, MenuSeparator, MenuLabel } from "@/components/Menu";
import { Settings, LogOut, User } from "lucide-react";

export function StandardDropdown() {
    return (
        <Dropdown placement="bottom-end">
            <DropdownTrigger className="px-4 py-2 bg-indigo-600 rounded-lg text-white font-medium hover:bg-indigo-500">
                Actions
            </DropdownTrigger>
            
            <DropdownPanel>
                <Menu>
                    <MenuLabel>My Account</MenuLabel>
                    <MenuItem icon={<User size={16} />}>Profile</MenuItem>
                    <MenuItem icon={<Settings size={16} />}>Settings</MenuItem>
                    <MenuSeparator />
                    <MenuItem danger icon={<LogOut size={16} />}>Log out</MenuItem>
                </Menu>
            </DropdownPanel>
        </Dropdown>
    );
}

```

### Advanced Usage (Custom Render Item via asChild)

`MenuItem` seamlessly accepts an `asChild` prop similar to Radix to render custom anchors without doubling up nodes, yet keeping menu styling and enter/focus controls.

```tsx
<Menu variant="compact">
    <MenuItem asChild>
        <a href="/dashboard">Return to Dashboard</a>
    </MenuItem>
</Menu>
```

## Accessibility Features

* Portal Renders entirely out of nested layouts meaning clipped absolute overflows are bypassed safely rendering directly into `document.body` overlaying everything precisely.
* Keyboard focus locks strictly into item boundaries. `Tab` escapes dropping context safely, `Enter` acts native click routing. `Esc` unbinds root rendering mapping focus back precisely up into root `triggerRef`.
* Re-sizes and scrolls calculate strictly against origin bounding rectangles forcing dynamic shifting across layout disruptions avoiding ghost placements.
* ARIA mappings assert native HTML standard mapping directly over nodes (`role="menuitem"`, `tabIndex={-1}`, `aria-controls`, `aria-expanded`).
