'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
      className={`grid grid-cols-4 gap-6 items-end ${className ?? ''}`}
    >
      {fields.map((field) => (
        <div key={field.name} className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-foreground">{field.label}</label>
          {field.type === 'select' ? (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input
              value={field.value}
              onChange={(e) => field.onChange(e.target.value)}
              placeholder={field.label}
            />
          )}
        </div>
      ))}
      <div className="flex justify-end">
        <Button type="submit" size="md">
          <Search className="h-4 w-4" />
          조회
        </Button>
      </div>
    </form>
  );
}
