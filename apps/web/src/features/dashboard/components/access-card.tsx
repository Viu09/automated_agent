"use client";

import type { FormEvent } from "react";

export function AccessCard({
  title,
  subtitle,
  buttonLabel,
  error,
  successMessage,
  fields,
  onSubmit,
}: {
  title: string;
  subtitle: string;
  buttonLabel: string;
  error: string | null;
  successMessage?: string | null;
  fields: Array<{ name: string; type: string; placeholder: string; minLength?: number }>;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void | Promise<void>;
}) {
  return (
    <div className="access-card">
      <h2>{title}</h2>
      <p>{subtitle}</p>
      <form className="access-form" onSubmit={onSubmit}>
        {fields.map((field) => (
          <input
            className="field-input"
            key={field.name}
            minLength={field.minLength}
            name={field.name}
            placeholder={field.placeholder}
            required={field.name !== "full_name"}
            type={field.type}
          />
        ))}
        <button className="primary-button wide" type="submit">
          {buttonLabel}
        </button>
      </form>
      {successMessage ? <div className="feedback success">{successMessage}</div> : null}
      {!successMessage && error ? <div className="feedback error">{error}</div> : null}
    </div>
  );
}
