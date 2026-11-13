/**
 * Real Google reviews from the salon's Maps listing, copied word for word with the reviewer's name
 * as shown on Google. Long reviews are cut down to one or two whole sentences. Staff names are left
 * out on purpose.
 */

export interface Review {
  quote: string;
  author: string;
}

export const REVIEWS: readonly Review[] = [
  {
    quote: "Exceptional experience! The staff were all friendly and patient.",
    author: "Diyaco Shwany",
  },
  {
    quote:
      "He took the time to understand what I wanted and, even more importantly, helped me choose and design a hairstyle that really suits me.",
    author: "Nathan Tse",
  },
  {
    quote:
      "The stylist took the time to design the perfect hairstyle for me, and the head massage during the shampoo nearly put me to sleep.",
    author: "s yancy",
  },
  {
    quote: "He pays so much attention to detail and always gets the cut just right.",
    author: "Yiran Wang",
  },
  {
    quote: "Finally found a hairdresser I really love!",
    author: "Hoi Lun Cheung",
  },
];
