import "@testing-library/jest-dom";
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Dropdown, DropdownTrigger, DropdownPanel } from '@/components/Dropdown';
import { Menu, MenuItem, MenuSeparator, MenuLabel } from '@/components/Menu';

function TestDropdown() {
    return (
        <Dropdown placement="bottom-start">
            <DropdownTrigger data-testid="trigger">Toggle Menu</DropdownTrigger>
            <DropdownPanel data-testid="panel">
                <Menu>
                    <MenuLabel>Actions</MenuLabel>
                    <MenuItem data-testid="item-1">Item 1</MenuItem>
                    <MenuItem data-testid="item-2">Item 2</MenuItem>
                    <MenuSeparator />
                    <MenuItem data-testid="item-3" danger>Delete</MenuItem>
                </Menu>
            </DropdownPanel>
        </Dropdown>
    );
}

describe('Dropdown & Menu Components', () => {

    it('renders the trigger button initially but not the panel', () => {
        render(<TestDropdown />);
        expect(screen.getByTestId('trigger')).toBeInTheDocument();
        // Since it's a portal and initially not rendered (or opacity 0), expect not to see items.
        expect(screen.queryByTestId('item-1')).not.toBeInTheDocument();
    });

    it('opens and closes the panel on trigger click', async () => {
        render(<TestDropdown />);
        const trigger = screen.getByTestId('trigger');

        fireEvent.click(trigger);

        await waitFor(() => {
            expect(screen.getByTestId('panel')).toBeInTheDocument();
        });

        expect(screen.getByTestId('item-1')).toBeVisible();

        fireEvent.click(trigger);

        await waitFor(() => {
            expect(screen.queryByTestId('item-1')).not.toBeInTheDocument();
        });
    });

    it('closes on Escape key press', async () => {
        render(<TestDropdown />);
        fireEvent.click(screen.getByTestId('trigger'));

        await waitFor(() => {
            expect(screen.getByTestId('panel')).toBeVisible();
        });

        fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });

        await waitFor(() => {
            expect(screen.queryByTestId('panel')).not.toBeInTheDocument();
        });
    });

    it('closes on outside click', async () => {
        render(
            <div>
                <div data-testid="outside">Outside Area</div>
                <TestDropdown />
            </div>
        );

        fireEvent.click(screen.getByTestId('trigger'));

        await waitFor(() => {
            expect(screen.getByTestId('panel')).toBeVisible();
        });

        fireEvent.mouseDown(screen.getByTestId('outside'));

        await waitFor(() => {
            expect(screen.queryByTestId('panel')).not.toBeInTheDocument();
        });
    });

    it('cycles focus through items on arrow keys', async () => {
        render(<TestDropdown />);

        const trigger = screen.getByTestId('trigger');
        trigger.focus();

        // Pressing down on trigger opens it
        fireEvent.keyDown(trigger, { key: 'ArrowDown', code: 'ArrowDown' });

        await waitFor(() => {
            expect(screen.getByTestId('panel')).toBeVisible();
        });

        const panel = screen.getByTestId('panel');
        fireEvent.keyDown(panel, { key: 'ArrowDown', code: 'ArrowDown' });

        await waitFor(() => {
            expect(screen.getByTestId('item-2')).toHaveFocus();
        });

        fireEvent.keyDown(panel, { key: 'ArrowUp', code: 'ArrowUp' });

        await waitFor(() => {
            expect(screen.getByTestId('item-1')).toHaveFocus();
        });
    });

    it('applies danger styling and icon configurations correctly', async () => {
        render(<TestDropdown />);

        fireEvent.click(screen.getByTestId('trigger'));

        await waitFor(() => {
            expect(screen.getByTestId('panel')).toBeVisible();
        });

        const dangerItem = screen.getByTestId('item-3');
        expect(dangerItem).toHaveClass('text-red-400');
    });

    it('applies correct ARIA attributes', async () => {
        render(<TestDropdown />);
        const trigger = screen.getByTestId('trigger');

        expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
        expect(trigger).toHaveAttribute('aria-expanded', 'false');

        fireEvent.click(trigger);

        await waitFor(() => {
            expect(trigger).toHaveAttribute('aria-expanded', 'true');
        });

        const panel = screen.getByTestId('panel');
        expect(panel).toHaveAttribute('role', 'menu');

        const item = screen.getByTestId('item-1');
        expect(item).toHaveAttribute('role', 'menuitem');
    });
});
