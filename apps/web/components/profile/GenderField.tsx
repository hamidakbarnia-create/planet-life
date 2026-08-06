'use client';

import {
  PROFILE_GENDER_VALUES,
  type ProfileGender,
} from '@/lib/profile/profile-gender';

export type GenderFieldLabels = {
  genderLabel: string;
  genderFemale: string;
  genderMale: string;
  genderPreferNot: string;
  required?: string;
};

type Props = {
  name: string;
  value: ProfileGender | '' | undefined;
  onChange: (value: ProfileGender) => void;
  labels: GenderFieldLabels;
  error?: string;
  dir?: 'ltr' | 'rtl';
};

const OPTION_LABEL_KEY: Record<
  ProfileGender,
  keyof Pick<GenderFieldLabels, 'genderFemale' | 'genderMale' | 'genderPreferNot'>
> = {
  female: 'genderFemale',
  male: 'genderMale',
  prefer_not_to_say: 'genderPreferNot',
};

/**
 * Required gender radio group for onboarding and profile edit.
 * Presentation-only control — does not touch engines.
 */
export function GenderField({
  name,
  value,
  onChange,
  labels,
  error,
  dir = 'ltr',
}: Props) {
  const legendId = `${name}-legend`;
  const errorId = `${name}-err`;

  return (
    <fieldset
      data-testid="profile-gender-field"
      dir={dir}
      aria-labelledby={legendId}
      aria-invalid={Boolean(error) || undefined}
      aria-describedby={error ? errorId : undefined}
      className="m-0 p-0 border-0"
    >
      <legend
        id={legendId}
        className="fi block text-xs text-white/50 mb-2 px-0"
      >
        {labels.genderLabel}{' '}
        <span aria-hidden="true">*</span>
        {labels.required ? (
          <span className="sr-only">({labels.required})</span>
        ) : null}
      </legend>
      <div className="space-y-2" role="radiogroup" aria-labelledby={legendId}>
        {PROFILE_GENDER_VALUES.map((option) => {
          const id = `${name}-${option}`;
          const checked = value === option;
          return (
            <label
              key={option}
              htmlFor={id}
              className="fi flex items-center gap-2.5 text-sm text-white/85 cursor-pointer rounded-lg px-3 py-2"
              style={{
                background: checked
                  ? 'rgba(212,175,55,0.12)'
                  : 'rgba(255,255,255,0.03)',
                border: `1px solid ${
                  checked
                    ? 'rgba(212,175,55,0.45)'
                    : error
                      ? 'rgba(239,68,68,0.35)'
                      : 'rgba(255,255,255,0.08)'
                }`,
              }}
            >
              <input
                id={id}
                type="radio"
                name={name}
                value={option}
                checked={checked}
                onChange={() => onChange(option)}
                className="accent-amber-400"
                data-testid={`profile-gender-${option}`}
              />
              <span>{labels[OPTION_LABEL_KEY[option]]}</span>
            </label>
          );
        })}
      </div>
      {error ? (
        <p id={errorId} className="fi mt-1.5 text-xs text-red-400" role="alert">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}
