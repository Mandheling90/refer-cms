'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { type FormEvent } from 'react';

interface SearchField {
  name: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: 'text' | 'select';
  options?: { value: string; label: string }[];
}

interface SearchBarProps {
  fields: SearchField[];
  onSearch: () => void;
  className?: string;
}

export function SearchBar({ fields, onSearch, className }: SearchBarProps) {
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSearch();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`flex items-end gap-3 p-4 bg-muted/50 rounded-lg ${className ?? ''}`}
    >
      {fields.map((field) => (
        <div key={field.name} className="flex flex-col gap-1">
          <label className="text-sm font-medium text-muted-foreground">{field.label}</label>
          {field.type === 'select' ? (
            <select
              value={field.value}
              onChange={(e) => field.onChange(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              {field.options?.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          ) : (
            <Input
              value={field.value}
              onChange={(e) => field.onChange(e.target.value)}
              placeholder={field.label}
              className="w-[200px]"
            />
          )}
        </div>
      ))}
      <Button type="submit" variant="outline" size="sm">
        <Search className="h-4 w-4 mr-1" />
        조회
      </Button>
    </form>
  );
}
