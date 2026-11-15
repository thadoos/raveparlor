"use client";

import { useRef } from "react";
import { cx } from "@/lib/cx";
import type { Review } from "@/lib/data/reviews";
import { useCarousel } from "@/lib/hooks/use-carousel";
import { useSwipe } from "@/lib/hooks/use-swipe";
import styles from "./ReviewsCarousel.module.css";

interface ReviewsCarouselProps {
  reviews: readonly Review[];
  intervalMs?: number;
}

export function ReviewsCarousel({ reviews, intervalMs = 3000 }: ReviewsCarouselProps) {
  const count = reviews.length;
  const { index, select, next, prev, pause, resume } = useCarousel(count, intervalMs);
  const stageRef = useRef<HTMLDivElement>(null);
  const swipe = useSwipe(stageRef, prev, next);

  return (
    <div
      className={styles.carousel}
      onMouseEnter={pause}
      onMouseLeave={resume}
      onFocus={pause}
      onBlur={resume}
    >
      <div ref={stageRef} className={styles.stage} {...swipe}>
        {reviews.map((review, i) => {
          const active = i === index;
          return (
            <figure
              key={review.author}
              className={cx(styles.review, active && styles.isActive)}
              aria-hidden={!active}
            >
              <blockquote className={styles.quote}>
                <p>{review.quote}</p>
              </blockquote>
              <figcaption className={styles.author}>{review.author}</figcaption>
            </figure>
          );
        })}
      </div>
      {count > 1 && (
        <div className={styles.dots}>
          {reviews.map((review, i) => (
            <button
              key={review.author}
              type="button"
              className={styles.dot}
              aria-label={`Show review ${i + 1} of ${count}`}
              aria-current={i === index ? "true" : undefined}
              onClick={() => select(i)}
            ></button>
          ))}
        </div>
      )}
    </div>
  );
}
