import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { format, parse, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DateInputProps {
  value: string;
  onChange: (value: string | null) => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
}

export function DateInput({ value, onChange, className, ...props }: DateInputProps) {
  const [displayValue, setDisplayValue] = useState('');

  // Initialize display value from ISO date
  useEffect(() => {
    if (value && value.length >= 10) {
      try {
        const date = new Date(value);
        if (isValid(date)) {
          setDisplayValue(format(date, 'dd/MM/yyyy', { locale: ptBR }));
        }
      } catch (e) {
        setDisplayValue('');
      }
    } else {
      setDisplayValue('');
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setDisplayValue(inputValue);
    
    // Only attempt to parse if we have a complete date
    if (inputValue.length === 10) {
      try {
        const parsedDate = parse(inputValue, 'dd/MM/yyyy', new Date(), { locale: ptBR });
        
        if (isValid(parsedDate)) {
          // Convert to ISO format for storage
          const isoDate = parsedDate.toISOString();
          onChange(isoDate);
        } else {
          onChange(null);
        }
      } catch (e) {
        onChange(null);
      }
    } else if (inputValue.length === 0) {
      // Clear the value if input is empty
      onChange(null);
    }
  };

  // Format input as user types (add slashes automatically)
  const formatInput = (input: string): string => {
    // Remove any non-digit characters
    const digits = input.replace(/\D/g, '');
    
    // Add slashes as needed
    if (digits.length <= 2) {
      return digits;
    } else if (digits.length <= 4) {
      return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    } else {
      return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Allow: backspace, delete, tab, escape, enter
    if ([46, 8, 9, 27, 13].indexOf(e.keyCode) !== -1 ||
        // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
        (e.keyCode === 65 && e.ctrlKey === true) ||
        (e.keyCode === 67 && e.ctrlKey === true) ||
        (e.keyCode === 86 && e.ctrlKey === true) ||
        (e.keyCode === 88 && e.ctrlKey === true) ||
        // Allow: home, end, left, right
        (e.keyCode >= 35 && e.keyCode <= 39)) {
      // Let it happen
      return;
    }
    
    // Ensure that it is a number and stop the keypress if not
    if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && 
        (e.keyCode < 96 || e.keyCode > 105)) {
      e.preventDefault();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedValue = formatInput(e.target.value);
    setDisplayValue(formattedValue);
    
    // Only attempt to parse if we have a complete date
    if (formattedValue.length === 10) {
      try {
        const parsedDate = parse(formattedValue, 'dd/MM/yyyy', new Date(), { locale: ptBR });
        
        if (isValid(parsedDate)) {
          // Convert to ISO format for storage
          const isoDate = parsedDate.toISOString();
          onChange(isoDate);
        } else {
          onChange(null);
        }
      } catch (e) {
        onChange(null);
      }
    } else if (formattedValue.length === 0) {
      // Clear the value if input is empty
      onChange(null);
    }
  };

  return (
    <Input
      type="text"
      value={displayValue}
      onChange={handleInputChange}
      onKeyDown={handleKeyDown}
      placeholder="DD/MM/AAAA"
      maxLength={10}
      className={className}
      {...props}
    />
  );
}