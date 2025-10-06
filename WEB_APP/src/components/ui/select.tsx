/**
 * Select Component
 * 下拉选择框组件 - 简化版本
 */

'use client';

import * as React from 'react';

interface SelectProps {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
  disabled?: boolean;
}

interface SelectTriggerProps {
  className?: string;
  id?: string;
  children: React.ReactNode;
}

interface SelectValueProps {
  placeholder?: string;
}

interface SelectContentProps {
  children: React.ReactNode;
}

interface SelectItemProps {
  value: string;
  children: React.ReactNode;
}

// Context for managing select state
const SelectContext = React.createContext<{
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
} | null>(null);

export function Select({ value, onValueChange, children, disabled }: SelectProps) {
  return (
    <SelectContext.Provider value={{ value, onValueChange, disabled }}>
      {children}
    </SelectContext.Provider>
  );
}

export function SelectTrigger({ className = '', id, children }: SelectTriggerProps) {
  const context = React.useContext(SelectContext);
  
  return (
    <div className="relative w-full">
      {/* Render select inside SelectContent */}
      {children}
    </div>
  );
}

export function SelectValue({ placeholder }: SelectValueProps) {
  return null; // This is just a placeholder component
}

export function SelectContent({ children }: SelectContentProps) {
  const context = React.useContext(SelectContext);
  
  if (!context) {
    throw new Error('SelectContent must be used within a Select');
  }
  
  return (
    <select
      value={context.value}
      onChange={(e) => context.onValueChange(e.target.value)}
      disabled={context.disabled}
      className="flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {children}
    </select>
  );
}

export function SelectItem({ value, children }: SelectItemProps) {
  return (
    <option value={value}>
      {children}
    </option>
  );
}
