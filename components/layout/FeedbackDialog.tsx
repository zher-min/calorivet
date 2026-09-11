"use client";
import { useRef, useState, type FormEvent } from "react";
import { usePathname } from "next/navigation";
const feedbackEndpoint = "https://formspree.io/f/mzebvqne";
export default function FeedbackDialog() {
  const pathname = usePathname();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  function openFeedback() {
    setStatus("idle");
    dialogRef.current?.showModal();
  }

  function closeFeedback() {
    dialogRef.current?.close();
  }

  async function submitFeedback(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setStatus("sending");

    try {
      const response = await fetch(feedbackEndpoint, {
        method: "POST",
        body: new FormData(form),
        headers: { Accept: "application/json" },
      });
      if (!response.ok) throw new Error("Feedback could not be sent");
      form.reset();
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  }

  return (
    <>
      <button className="feedback-link" type="button" onClick={openFeedback}>Send feedback</button>
      <dialog aria-labelledby="site-feedback-title" className="feedback-dialog" ref={dialogRef} onClose={() => setStatus("idle")} onClick={(event) => {
        if (event.target === event.currentTarget) closeFeedback();
      }}>
        <div className="feedback-dialog-card">
          <div className="feedback-dialog-heading">
            <div>
              <span>VetTools feedback</span>
              <h2 id="site-feedback-title">Help improve the calculator</h2>
            </div>
            <button type="button" onClick={closeFeedback} aria-label="Close feedback form">×</button>
          </div>

          {status === "sent" ? (
            <div className="feedback-success" role="status">
              <strong>Thank you—your feedback was sent.</strong>
              <p>It will help guide the next VetTools update.</p>
              <button type="button" onClick={closeFeedback}>Done</button>
            </div>
          ) : (
            <form action={feedbackEndpoint} method="POST" onSubmit={submitFeedback}>
              <input type="hidden" name="subject" value={`VetTools feedback — ${pathname}`} />
              <input type="hidden" name="page" value={pathname} />
              <label className="feedback-honeypot" aria-hidden="true">
                Leave this field empty
                <input name="_gotcha" tabIndex={-1} autoComplete="off" />
              </label>
              <label>
                <span>Your feedback</span>
                <textarea name="message" rows={5} maxLength={2000} required placeholder="What worked well, or what could be clearer?" />
              </label>
              <div className="feedback-contact-grid">
                <label>
                  <span>Name <small>(optional)</small></span>
                  <input name="name" type="text" maxLength={80} autoComplete="name" />
                </label>
                <label>
                  <span>Email for reply <small>(optional)</small></span>
                  <input name="email" type="email" maxLength={160} autoComplete="email" />
                </label>
              </div>
              <p className="feedback-privacy">Contact details are optional and used only if a reply is needed.</p>
              {status === "error" && <p className="feedback-error" role="alert">The feedback could not be sent. Please try again.</p>}
              <div className="feedback-actions">
                <button type="button" onClick={closeFeedback}>Cancel</button>
                <button type="submit" disabled={status === "sending"}>{status === "sending" ? "Sending…" : "Send feedback"}</button>
              </div>
            </form>
          )}
        </div>
      </dialog>
    </>
  );
}
