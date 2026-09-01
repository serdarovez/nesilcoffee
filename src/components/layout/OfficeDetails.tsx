"use client";

import { telHref } from "@/lib/contact-format";
import { useLocalOffice } from "./useLocalOffice";

/**
 * Address and phone list that fall back to head office.
 *
 * Both take what the server rendered and show exactly that unless the visitor
 * turns out to have a branch office in their country, at which point they swap.
 * Keeping the server value as the initial render is what lets the surrounding
 * pages stay static: nothing here is empty or shifting while the lookup runs,
 * and for most visitors the answer is "no branch" and nothing ever changes.
 */

export function OfficeAddress({
  address,
  className,
}: {
  /** Head-office address, already localized by the server. */
  address: string;
  className?: string;
}) {
  const local = useLocalOffice();
  return <p className={className}>{local?.address || address}</p>;
}

export function OfficePhones({
  phones,
  className,
  linkClassName,
}: {
  /** Head-office numbers, in display form. */
  phones: string[];
  className?: string;
  linkClassName?: string;
}) {
  const local = useLocalOffice();
  // Only swap when the branch actually lists numbers — an office row with an
  // address but no phones should not blank the head-office ones.
  const shown = local?.phones.length ? local.phones : phones;

  return (
    <div className={className}>
      {shown.map((phone) => (
        <a key={phone} href={telHref(phone)} className={linkClassName}>
          {phone}
        </a>
      ))}
    </div>
  );
}
