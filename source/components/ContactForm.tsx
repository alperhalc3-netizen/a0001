
"use client";

import { FormEvent, useState } from "react";
import { site } from "@/lib/content";
import styles from "./ContactForm.module.css";

type Errors = {
  name?: string;
  email?: string;
  message?: string;
};

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [submitted, setSubmitted] = useState(false);

  function validate() {
    const next: Errors = {};
    if (!name.trim()) next.name = "Please enter your name.";
    if (!email.trim()) next.email = "Please enter your email.";
    else if (!isValidEmail(email.trim())) next.email = "Enter a valid email address.";
    if (!message.trim()) next.message = "Please write a short message.";
    else if (message.trim().length < 10) next.message = "Message should be at least 10 characters.";
    return next;
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length === 0) {
      setSubmitted(true);
    }
  }

  if (submitted) {
    const mailto = `mailto:${site.email}?subject=${encodeURIComponent(`Inquiry from ${name}`)}&body=${encodeURIComponent(message + "\n\n— " + name + "\n" + email)}`;
    return (
      <div className={styles.success} role="status">
        <p>Message prepared</p>
        <p>
          This contact form is a placeholder and does not send mail yet.
          Please write directly to {site.email}, or open your email client
          with the message drafted.
        </p>
        <a className="btn" href={mailto}>
          Open email draft
        </a>
      </div>
    );
  }

  return (
    <form className={styles.form} onSubmit={onSubmit} noValidate>
      <div className={styles.field}>
        <label htmlFor="name">Name</label>
        <input
          id="name"
          name="name"
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? "name-error" : undefined}
        />
        {errors.name ? (
          <p id="name-error" className={styles.error} role="alert">
            {errors.name}
          </p>
        ) : null}
      </div>
      <div className={styles.field}>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? "email-error" : undefined}
        />
        {errors.email ? (
          <p id="email-error" className={styles.error} role="alert">
            {errors.email}
          </p>
        ) : null}
      </div>
      <div className={styles.field}>
        <label htmlFor="message">Message</label>
        <textarea
          id="message"
          name="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          aria-invalid={Boolean(errors.message)}
          aria-describedby={errors.message ? "message-error" : undefined}
        />
        {errors.message ? (
          <p id="message-error" className={styles.error} role="alert">
            {errors.message}
          </p>
        ) : null}
      </div>
      <div className={styles.actions}>
        <button className="btn" type="submit">
          Send message
        </button>
      </div>
    </form>
  );
}
