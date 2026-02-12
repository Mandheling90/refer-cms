'use client';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface FormFieldProps {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  type?: 'text' | 'password' | 'textarea';
  placeholder?: string;
  readOnly?: boolean;
  required?: boolean;
  className?: string;
}

export function FormField({
  label,
  name,
  value,
  onChange,
  type = 'text',
  placeholder,
  readOnly,
  required,
  className,
}: FormFieldProps) {
  return (
    <div className={`grid gap-1.5 ${className ?? ''}`}>
      <Label htmlFor={name}>
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      {type === 'textarea' ? (
        <Textarea
          id={name}
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          readOnly={readOnly}
          rows={3}
        />
      ) : (
        <Input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          readOnly={readOnly}
        />
      )}
    </div>
  );
}
