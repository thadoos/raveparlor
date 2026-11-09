"use client";

import { useReducer, useRef, type MouseEvent } from "react";
import { bookingHref } from "@/lib/booking/href";
import {
  bookIntent,
  initialPickerState,
  pickerReducer,
  type Selection,
} from "@/lib/booking/picker";
import { MENU, isPickable } from "@/lib/data/services";
import { useReducedMotion } from "@/lib/hooks/use-media";
import { DialogActions } from "./DialogActions";
import { DialogDetails } from "./DialogDetails";
import { DialogMedia } from "./DialogMedia";
import { DialogRating } from "./DialogRating";
import type { DialogTarget } from "./dialog-state";
import { PriceTable } from "./PriceTable";
import { SinglePrice } from "./SinglePrice";
import { useNudge } from "./use-nudge";

interface ServiceDialogContentProps {
  target: DialogTarget;
}

/**
 * The details of one service plus its booking picker. Mount it fresh for every open (key it), so
 * the selection starts empty.
 */
export function ServiceDialogContent({ target }: ServiceDialogContentProps) {
  const category = MENU[target.category];
  const item = category.items[target.index];
  const [picker, dispatch] = useReducer(pickerReducer, target.picking, initialPickerState);
  const [nudging, nudge] = useNudge();
  const reducedMotion = useReducedMotion();
  const priceRef = useRef<HTMLDivElement>(null);
  const bookRef = useRef<HTMLAnchorElement>(null);
  const pickable = isPickable(item, category);

  function onBook(e: MouseEvent<HTMLAnchorElement>) {
    const intent = bookIntent(picker, pickable);
    if (intent === "follow") return; // on to WhatsApp
    e.preventDefault();
    if (intent === "flip") {
      dispatch({ type: "flip" });
      priceRef.current?.scrollIntoView({
        block: "nearest",
        behavior: reducedMotion ? "auto" : "smooth",
      });
    } else {
      nudge();
    }
  }

  function onBack() {
    dispatch({ type: "back" });
    bookRef.current?.focus({ preventScroll: true });
  }

  const priceProps = {
    item,
    category,
    picking: picker.flipped,
    selection: picker.selection,
    onPick: (selection: Selection) => dispatch({ type: "pick", selection }),
  };

  return (
    <div className="md-body">
      <DialogMedia images={category.images} />
      <div className="md-text">
        <DialogRating />
        <p className="md-cat" id="md-cat">
          {category.name}
        </p>
        <h3 className="md-name" id="md-name">
          {item.name}
        </h3>
        <div className={nudging ? "md-price nudge" : "md-price"} id="md-price" ref={priceRef}>
          {item.cols ? <PriceTable {...priceProps} /> : <SinglePrice {...priceProps} />}
        </div>
        <DialogDetails item={item} flipped={picker.flipped} />
        <DialogActions
          href={bookingHref({ item, category, selection: picker.selection })}
          flipped={picker.flipped}
          blocked={picker.flipped && !picker.selection}
          bookRef={bookRef}
          onBook={onBook}
          onBack={onBack}
        />
      </div>
    </div>
  );
}
