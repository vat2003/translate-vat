"use client";

import { Languages } from "lucide-react";
import type { LanguageOption } from "@/lib/types";

type LanguageSelectorProps = {
  languages: LanguageOption[];
  value: string;
  onChange: (value: string) => void;
};

export function LanguageSelector({ languages, value, onChange }: LanguageSelectorProps) {
  return (
    <div>
      <label className="field-label" htmlFor="target-language">
        Target Language
      </label>
      <div className="relative">
        <Languages
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
          size={17}
        />
        <select
          id="target-language"
          className="input-field pl-10"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        >
          <option value="all">All configured languages ({languages.length})</option>
          {languages.map((language) => (
            <option key={language.code} value={language.code}>
              {language.label} ({language.code})
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
