"use client";

import * as React from "react";
import Link from "next/link";
import { Check, Trash2 } from "lucide-react";
import { deleteNotification, markNotificationRead } from "@/app/actions/notifications";
import { Button } from "@/components/ui/button";
import { safeNext } from "@/lib/safe-redirect";

export type AccountNotification = {
  id: string;
  title: string;
  body: string | null;
  href: string | null;
  read_at: string | null;
  created_at: string;
};

export function NotificationList({ initialItems }: { initialItems: AccountNotification[] }) {
  const [items, setItems] = React.useState(initialItems);
  const [message, setMessage] = React.useState("");
  const [busyId, setBusyId] = React.useState<string | null>(null);

  async function markRead(id: string) {
    setBusyId(id);
    setMessage("");
    const result = await markNotificationRead(id);
    if (result.ok) setItems((current) => current.map((item) => item.id === id ? { ...item, read_at: new Date().toISOString() } : item));
    else setMessage("We couldn't update that notification. Please try again.");
    setBusyId(null);
  }

  async function remove(id: string) {
    setBusyId(id);
    setMessage("");
    const result = await deleteNotification(id);
    if (result.ok) setItems((current) => current.filter((item) => item.id !== id));
    else setMessage("We couldn't delete that notification. Please try again.");
    setBusyId(null);
  }

  return (
    <div className="space-y-3">
      {message ? <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{message}</p> : null}
      {items.length ? items.map((item) => {
        const href = safeNext(item.href, "/account/notifications");
        return (
          <article key={item.id} className={`rounded-xl border p-4 sm:p-5 ${item.read_at ? "border-line bg-white" : "border-blue-200 bg-blue-50/60"}`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  {!item.read_at ? <span aria-label="Unread" className="h-2 w-2 shrink-0 rounded-full bg-blue-700" /> : null}
                  <h3 className="break-words font-semibold">{item.title}</h3>
                </div>
                {item.body ? <p className="mt-1.5 whitespace-pre-wrap break-words text-sm leading-relaxed text-neutral-700">{item.body}</p> : null}
                <time dateTime={item.created_at} className="mt-2 block text-xs text-neutral-500">
                  {new Date(item.created_at).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" })}
                </time>
                {item.href ? <Link href={href} className="mt-2 inline-flex min-h-10 items-center text-sm font-semibold text-blue-800 underline underline-offset-2">View details</Link> : null}
              </div>
              <div className="flex shrink-0 gap-1">
                {!item.read_at ? <Button variant="ghost" size="sm" disabled={busyId === item.id} onClick={() => void markRead(item.id)} aria-label={`Mark ${item.title} as read`}><Check className="h-4 w-4" /> Read</Button> : null}
                <Button variant="ghost" size="icon" disabled={busyId === item.id} onClick={() => void remove(item.id)} aria-label={`Delete ${item.title}`}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
          </article>
        );
      }) : (
        <div className="rounded-2xl border border-dashed border-line bg-surface/50 px-5 py-10 text-center">
          <h3 className="font-display text-lg font-bold">You&apos;re all caught up</h3>
          <p className="mt-2 text-sm text-neutral-600">New order and account updates will appear here.</p>
        </div>
      )}
    </div>
  );
}
