"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import {
  addReview,
  moveReview,
  removeReview,
  setReviewStats,
  updateReview,
} from "@/lib/admin/draft-ops";
import { newId } from "@/lib/admin/uuid";
import { REVIEW_AUTHOR_MAX, REVIEW_QUOTE_MAX } from "@/lib/content/site-copy";
import type { Review } from "@/lib/content/schema";
import { NumberField } from "./NumberField";
import { TextArea } from "./TextArea";
import { TextField } from "./TextField";
import type { EditorProps } from "./types";
import { useDragReorder } from "./use-drag-reorder";
import shared from "./Editor.module.css";
import styles from "./BarbersEditor.module.css";

/** The review score and count, the stars shown, and the list of quotes. */
export function ReviewsEditor({ draft, apply }: EditorProps) {
  const [open, setOpen] = useState<string | null>(null);
  const [removing, setRemoving] = useState<Review | null>(null);
  const [adding, setAdding] = useState(false);

  const { score, count, stars, items } = draft.reviews;
  const reorder = useDragReorder(
    items.map((r) => r.id),
    (id, to) => apply((c) => moveReview(c, id, to)),
  );

  return (
    <div className={shared.stack}>
      <section className={shared.stack} aria-label="Rating">
        <p className="admin-label">Rating</p>
        <div className={shared.row}>
          <NumberField
            label="Score"
            value={score}
            onChange={(n) => apply((c) => setReviewStats(c, { score: n }))}
            min={0}
            max={5}
            decimals={1}
          />
          <NumberField
            label="Review count"
            value={count}
            onChange={(n) => apply((c) => setReviewStats(c, { count: n }))}
            min={0}
            decimals={0}
          />
          <NumberField
            label="Stars shown"
            value={stars}
            onChange={(n) => apply((c) => setReviewStats(c, { stars: n }))}
            min={1}
            max={5}
            decimals={0}
          />
        </div>
        <p className={shared.note}>
          Shown as &ldquo;{score.toFixed(1)} out of 5&rdquo; with the review count and a row of
          stars.
        </p>
      </section>

      <section className={shared.stack} aria-label="Reviews">
        <p className="admin-label">Reviews</p>
        <ol className={styles.list}>
          {items.map((review, index) => {
            const isOpen = open === review.id;
            const dragging = reorder.draggingId;
            const offset = reorder.offsetAt(index);
            return (
              <li
                key={review.id}
                ref={reorder.rowRef(review.id)}
                className={`${styles.item} ${dragging ? styles.sorting : ""} ${
                  dragging === review.id ? styles.dragging : ""
                }`}
                style={offset !== undefined ? { transform: `translateY(${offset}px)` } : undefined}
              >
                <div className={styles.row}>
                  <button
                    type="button"
                    className={styles.handle}
                    aria-label={`Drag to reorder review by ${review.author}`}
                    {...reorder.handleProps(review.id)}
                  >
                    <span aria-hidden="true">⠿</span>
                  </button>
                  <button
                    type="button"
                    className={styles.summary}
                    aria-expanded={isOpen}
                    onClick={() => setOpen(isOpen ? null : review.id)}
                  >
                    <span className={styles.name}>{review.author || "Unnamed author"}</span>
                    <span className={styles.days}>{review.quote || "Empty quote"}</span>
                  </button>
                  <div className={styles.moves}>
                    <button
                      type="button"
                      className={styles.iconButton}
                      aria-label={`Move review by ${review.author} up`}
                      disabled={index === 0}
                      onClick={() => apply((c) => moveReview(c, review.id, index - 1))}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      className={styles.iconButton}
                      aria-label={`Move review by ${review.author} down`}
                      disabled={index === items.length - 1}
                      onClick={() => apply((c) => moveReview(c, review.id, index + 1))}
                    >
                      ↓
                    </button>
                  </div>
                </div>
                {isOpen ? (
                  <div className={styles.details}>
                    <TextArea
                      label="Quote"
                      value={review.quote}
                      onChange={(quote) => apply((c) => updateReview(c, review.id, { quote }))}
                      rows={4}
                      required
                      maxLength={REVIEW_QUOTE_MAX}
                    />
                    <TextField
                      label="Author"
                      value={review.author}
                      onChange={(author) => apply((c) => updateReview(c, review.id, { author }))}
                      required
                      maxLength={REVIEW_AUTHOR_MAX}
                    />
                    <button
                      type="button"
                      className={`admin-button ${shared.secondary}`}
                      disabled={items.length === 1}
                      onClick={() => setRemoving(review)}
                    >
                      Remove review
                    </button>
                    {items.length === 1 ? (
                      <p className={shared.note}>The site needs at least one review.</p>
                    ) : null}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ol>

        {adding ? (
          <AddReviewForm
            onAdd={(review) => {
              apply((c) => addReview(c, review, newId()));
              setAdding(false);
            }}
            onCancel={() => setAdding(false)}
          />
        ) : (
          <button type="button" className="admin-button" onClick={() => setAdding(true)}>
            Add review
          </button>
        )}
      </section>

      <ConfirmDialog
        open={removing !== null}
        title={`Remove the review by ${removing?.author ?? "this author"}?`}
        confirmLabel="Remove"
        onConfirm={() => {
          if (removing) apply((c) => removeReview(c, removing.id));
          setRemoving(null);
          setOpen(null);
        }}
        onCancel={() => setRemoving(null)}
      >
        It disappears from the site once you publish.
      </ConfirmDialog>
    </div>
  );
}

interface AddReviewFormProps {
  onAdd: (review: Omit<Review, "id">) => void;
  onCancel: () => void;
}

/** Inline form for a new review. Nothing reaches the draft until both fields are filled. */
function AddReviewForm({ onAdd, onCancel }: AddReviewFormProps) {
  const [quote, setQuote] = useState("");
  const [author, setAuthor] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function submit(event: FormEvent) {
    event.preventDefault();
    setSubmitted(true);
    const q = quote.trim();
    const a = author.trim();
    if (!q || !a) return;
    onAdd({ quote: q, author: a });
  }

  // "Required" only shows once Add has been tried, so the empty form starts clean.
  return (
    <form className={`${shared.stack} ${styles.addForm}`} onSubmit={submit} noValidate>
      <p className="admin-label">New review</p>
      <TextArea
        label="Quote"
        value={quote}
        onChange={setQuote}
        rows={4}
        required={submitted}
        maxLength={REVIEW_QUOTE_MAX}
      />
      <TextField
        label="Author"
        value={author}
        onChange={setAuthor}
        required={submitted}
        maxLength={REVIEW_AUTHOR_MAX}
      />
      <div className={styles.formActions}>
        <button type="button" className={`admin-button ${shared.secondary}`} onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="admin-button">
          Add
        </button>
      </div>
    </form>
  );
}
