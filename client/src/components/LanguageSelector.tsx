import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Globe } from "lucide-react";

export interface Language {
  code: string;
  name: string;
  displayName: string;
}

export const ASEAN_LANGUAGES: Language[] = [
  { code: 'en', name: 'English', displayName: 'English' },
  { code: 'ms', name: 'Bahasa Malaysia', displayName: 'Bahasa Malaysia' },
  { code: 'id', name: 'Bahasa Indonesia', displayName: 'Bahasa Indonesia' },
  { code: 'th', name: 'ไทย', displayName: 'ไทย (Thai)' },
  { code: 'vi', name: 'Tiếng Việt', displayName: 'Tiếng Việt (Vietnamese)' },
  { code: 'tl', name: 'Filipino', displayName: 'Filipino' },
  { code: 'zh-sg', name: '中文', displayName: '中文 (Chinese - Singapore)' },
];

interface LanguageSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
}

export default function LanguageSelector({ value, onValueChange, className }: LanguageSelectorProps) {
  const selectedLanguage = ASEAN_LANGUAGES.find(lang => lang.code === value);
  
  return (
    <div className={`flex items-center space-x-3 ${className || ''}`}>
      <div className="flex items-center space-x-2">
        <Globe className="w-4 h-4 text-gray-500" />
        <span className="text-sm font-medium text-gray-700">Interview Language</span>
      </div>
      
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="w-[280px]">
          <SelectValue>
            {selectedLanguage ? (
              <div className="flex items-center space-x-2">
                <span>{selectedLanguage.displayName}</span>
                {selectedLanguage.code !== 'en' && (
                  <span className="text-xs text-gray-500">+ English</span>
                )}
              </div>
            ) : (
              <span>Select Language</span>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {ASEAN_LANGUAGES.map((language) => (
            <SelectItem key={language.code} value={language.code}>
              <div className="flex items-center justify-between w-full">
                <span>{language.displayName}</span>
                {language.code === 'en' && (
                  <span className="text-xs text-green-600 ml-2">✓ Default</span>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {value !== 'en' && (
        <div className="text-xs text-gray-500">
          <p>Questions shown in both languages</p>
          <p>AI feedback provided in English</p>
        </div>
      )}
    </div>
  );
}