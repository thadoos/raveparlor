"use client";

import type { HTMLAttributes, ReactNode } from "react";
import { useReveal } from "@/lib/hooks/use-reveal";

type RevealTag = "div" | "h2" | "h3" | "p" | "section";

interface RevealProps extends HTMLAttributes<HTMLElement> {
  /** The element to render. */
  as?: RevealTag;
  children: ReactNode;
}

/** Fades its element in when it scrolls into view. Visible in the server HTML, so it works without JS. */
export function Reveal({ as: Tag = "div", className, children, ...rest }: RevealProps) {
  const { attach, className: revealClass } = useReveal();
  return (
    <Tag {...rest} ref={attach} className={className ? `${className} ${revealClass}` : revealClass}>
      {children}
    </Tag>
  );
}
