'use client';

import type { FormEvent } from 'react';
import styles from './ask-home.module.css';

export function DecisionSearch({
  id,
  value,
  placeholder,
  ariaLabel,
  submitAria,
  counterLabel,
  disabled,
  onChange,
  onSubmit,
}: {
  id: string;
  value: string;
  placeholder: string;
  ariaLabel: string;
  submitAria: string;
  counterLabel: string;
  disabled: boolean;
  onChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <div>
      <form className={styles.searchForm} onSubmit={onSubmit} noValidate>
        <label htmlFor={id} className="sr-only">
          {ariaLabel}
        </label>
        <input
          id={id}
          name="decision"
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          autoComplete="off"
          className={`fi ${styles.searchInput}`}
          aria-describedby={`${id}-counter`}
        />
        <button
          type="submit"
          className={styles.searchSubmit}
          disabled={disabled}
          aria-label={submitAria}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
            <path
              d="M4 9h9M9.5 4.5 14 9l-4.5 4.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </form>
      <p id={`${id}-counter`} className={`fi ${styles.searchMeta}`} aria-live="polite">
        {counterLabel}
      </p>
    </div>
  );
}
