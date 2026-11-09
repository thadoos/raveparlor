import styles from "./SkipLink.module.css";

/** First focusable element on the page: jumps keyboard users past the header and menu to the deck. */
export function SkipLink() {
  return (
    <a className={styles.skip} href="#deck" data-skip-link>
      Skip to content
    </a>
  );
}
