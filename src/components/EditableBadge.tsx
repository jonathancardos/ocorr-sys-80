"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface EditableBadgeOption {
  label: string;
  value: string | number | boolean | null;
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'riskLow' | 'riskModerate' | 'riskGrave' | 'riskCritical';
  icon?: React.ElementType;
}

interface EditableBadgeProps {
  currentValue: string | number | boolean | null;
  displayValue: string;
  options: EditableBadgeOption[];
  onSave: (newValue: string | number | boolean | null) => void;
  isLoading?: boolean;
  className?: string;
  badgeVariant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'riskLow' | 'riskModerate' | 'riskGrave' | 'riskCritical';
  icon?: React.ElementType;
  disabled?: boolean;
}

export const EditableBadge: React.FC<EditableBadgeProps> = ({
  currentValue,
  displayValue,
  options,
  onSave,
  isLoading = false,
  className,
  badgeVariant,
  icon: Icon,
  disabled = false,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const selectRef = useRef<HTMLButtonElement>(null);

  const handleSelectChange = (newValue: string) => {
    const selectedOption = options.find(option => String(option.value) === newValue);
    if (selectedOption) {
      onSave(selectedOption.value);
    }
    setIsEditing(false);
  };

  const handleBlur = () => {
    // Delay blur to allow click on select items
    setTimeout(() => {
      if (document.activeElement !== selectRef.current) {
        setIsEditing(false);
      }
    }, 100);
  };

  useEffect(() => {
    if (isEditing && selectRef.current) {
      selectRef.current.focus();
    }
  }, [isEditing]);

  if (isLoading) {
    return (
      <Badge variant="secondary" className={cn("flex items-center gap-1", className)}>
        <Loader2 className="h-3 w-3 animate-spin" />
        {displayValue}
      </Badge>
    );
  }

  if (isEditing && !disabled) {
    return (
      <Select
        value={String(currentValue)}
        onValueChange={handleSelectChange}
        onOpenChange={(open) => !open && handleBlur()}
      >
        <SelectTrigger ref={selectRef} className={cn("h-8 w-full min-w-[120px] text-xs", className)}>
          <SelectValue placeholder={displayValue} />
        </SelectTrigger>
        <SelectContent>
          {options.map(option => (
            <SelectItem key={String(option.value)} value={String(option.value)}>
              <div className="flex items-center gap-2">
                {option.icon && <option.icon className="h-3 w-3" />}
                {option.label}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  return (
    <Badge
      variant={badgeVariant || 'secondary'}
      className={cn(
        "cursor-pointer hover:opacity-80 transition-opacity flex items-center gap-1",
        disabled && "opacity-70 cursor-not-allowed",
        className
      )}
      onClick={() => !disabled && setIsEditing(true)}
    >
      {Icon && <Icon className="h-3 w-3" />}
      {displayValue}
    </Badge>
  );
};