"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { addCartItem, clearSavedCart, loadCart, removeCartItem, setCartItemQuantity } from "@/app/actions/cart";
import type { CartItem, CartLine } from "@/lib/cart/types";
import { MAX_QTY_PER_LINE } from "@/lib/site-config";

export type { CartItem } from "@/lib/cart/types";

type AddItem = Omit<CartItem, "quantity" | "availableStock" | "unavailable"> & { availableStock?: number };
type CartContextValue = {
  items: CartItem[];
  hydrated: boolean;
  pending: boolean;
  error: string | null;
  count: number;
  subtotalKobo: number;
  add: (item: AddItem, quantity: number) => Promise<{ ok: boolean; error?: string }>;
  setQuantity: (variantId: string, quantity: number) => Promise<{ ok: boolean; error?: string }>;
  remove: (variantId: string) => Promise<{ ok: boolean; error?: string }>;
  clear: () => Promise<void>;
};

type CartMode = "loading" | "local" | "account";
const STORAGE_KEY = "drishop-cart-v1";
const LEGACY_STORAGE_KEY = "shopora-cart-v1";
const ACCOUNT_SYNC_KEY = "drishop-cart-sync-v1";
const CartContext = React.createContext<CartContextValue | null>(null);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function clampQty(qty: number, max: number) {
  return Math.max(1, Math.min(Math.floor(qty), Math.max(1, max), MAX_QTY_PER_LINE));
}

function readGuestCart(): CartItem[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY) ?? window.localStorage.getItem(LEGACY_STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed.slice(0, 50).flatMap((value): CartItem[] => {
      if (!value || typeof value !== "object") return [];
      const item = value as Partial<CartItem>;
      if (typeof item.variantId !== "string" || !UUID.test(item.variantId)
          || typeof item.productId !== "string" || typeof item.slug !== "string"
          || typeof item.name !== "string" || typeof item.priceKobo !== "number"
          || !Number.isFinite(item.priceKobo) || typeof item.quantity !== "number"
          || !Number.isInteger(item.quantity) || item.quantity < 1) return [];
      const max = typeof item.maxQuantity === "number" ? item.maxQuantity : MAX_QTY_PER_LINE;
      return [{
        variantId: item.variantId,
        productId: item.productId,
        slug: item.slug,
        name: item.name.slice(0, 200),
        variantName: typeof item.variantName === "string" ? item.variantName.slice(0, 100) : null,
        priceKobo: Math.max(0, Math.floor(item.priceKobo)),
        imageUrl: typeof item.imageUrl === "string" ? item.imageUrl : null,
        quantity: clampQty(item.quantity, max),
        maxQuantity: clampQty(max, MAX_QTY_PER_LINE),
        availableStock: typeof item.availableStock === "number" && Number.isFinite(item.availableStock) ? Math.max(0, item.availableStock) : max,
        unavailable: item.unavailable === true,
      }];
    });
  } catch {
    return [];
  }
}

function linesFrom(items: CartItem[]): CartLine[] {
  return items.slice(0, 50).map(({ variantId, quantity }) => ({ variantId, quantity: clampQty(quantity, MAX_QTY_PER_LINE) }));
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [items, setItems] = React.useState<CartItem[]>([]);
  const [mode, setMode] = React.useState<CartMode>("loading");
  const [hydrated, setHydrated] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const loadVersion = React.useRef(0);

  React.useEffect(() => {
    const version = ++loadVersion.current;
    const guestItems = readGuestCart();
    setPending(true);
    loadCart(linesFrom(guestItems)).then((result) => {
      if (version !== loadVersion.current) return;
      if (result.ok && result.authenticated) {
        setMode("account");
        setItems(result.items);
        setError(result.warning ?? null);
        try {
          window.localStorage.removeItem(STORAGE_KEY);
          window.localStorage.removeItem(LEGACY_STORAGE_KEY);
        } catch { /* cart remains in memory */ }
      } else if (result.ok) {
        setMode("local");
        setItems(guestItems);
        setError(null);
      } else {
        setMode("local");
        setItems(guestItems);
        setError(result.error);
      }
      setHydrated(true);
      setPending(false);
    }).catch(() => {
      if (version !== loadVersion.current) return;
      setMode("local");
      setItems(guestItems);
      setError("We couldn't sync your saved cart. Your items remain on this device.");
      setHydrated(true);
      setPending(false);
    });
    return () => { loadVersion.current += 1; };
  }, [pathname]);

  React.useEffect(() => {
    if (!hydrated || mode !== "local") return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      window.localStorage.removeItem(LEGACY_STORAGE_KEY);
    } catch { /* private mode or storage quota */ }
  }, [items, hydrated, mode]);

  React.useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY && mode === "local") setItems(readGuestCart());
      if (event.key === ACCOUNT_SYNC_KEY && mode === "account") {
        void loadCart([]).then((result) => {
          if (result.ok && result.authenticated) setItems(result.items);
        });
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [mode]);

  const value = React.useMemo<CartContextValue>(() => {
    async function applyAccountResult(result: Awaited<ReturnType<typeof addCartItem>>) {
      if (!result.ok) {
        setError(result.error);
        return { ok: false, error: result.error };
      }
      setItems(result.items);
      try { window.localStorage.setItem(ACCOUNT_SYNC_KEY, String(Date.now())); } catch { /* cross-tab refresh is best effort */ }
      setError(result.warning ?? null);
      return { ok: true };
    }

    return {
      items,
      hydrated,
      pending,
      error,
      count: items.reduce((total, item) => total + item.quantity, 0),
      subtotalKobo: items.reduce((total, item) => total + item.priceKobo * item.quantity, 0),
      add: async (item, quantity) => {
        if (pending) return { ok: false, error: "Please wait for the cart to finish syncing." };
        setPending(true);
        setError(null);
        try {
          if (mode === "account") {
            const result = await addCartItem({ variantId: item.variantId, quantity });
            return await applyAccountResult(result);
          }
          if (items.length >= 50 && !items.some((entry) => entry.variantId === item.variantId)) {
            const message = "Your cart has reached the 50-item checkout limit.";
            setError(message);
            return { ok: false, error: message };
          }
          setItems((current) => {
            const existing = current.find((entry) => entry.variantId === item.variantId);
            const maxQuantity = Math.max(1, Math.min(item.maxQuantity, item.availableStock ?? item.maxQuantity, MAX_QTY_PER_LINE));
            if (existing) return current.map((entry) => entry.variantId === item.variantId
              ? { ...entry, ...item, availableStock: item.availableStock ?? item.maxQuantity,
                quantity: clampQty(entry.quantity + quantity, maxQuantity) }
              : entry);
            return [...current, { ...item, availableStock: item.availableStock ?? item.maxQuantity,
              quantity: clampQty(quantity, maxQuantity) }];
          });
          return { ok: true };
        } catch {
          const message = "We couldn't update your cart. Please try again.";
          setError(message);
          return { ok: false, error: message };
        } finally { setPending(false); }
      },
      setQuantity: async (variantId, quantity) => {
        if (pending) return { ok: false, error: "Please wait for the cart to finish syncing." };
        setPending(true);
        setError(null);
        try {
          if (mode === "account") return await applyAccountResult(await setCartItemQuantity({ variantId, quantity }));
          setItems((current) => current.map((item) => item.variantId === variantId
            ? { ...item, quantity: clampQty(quantity, Math.min(item.maxQuantity, item.availableStock || item.maxQuantity)) }
            : item));
          return { ok: true };
        } catch {
          const message = "We couldn't update the quantity. Please try again.";
          setError(message);
          return { ok: false, error: message };
        } finally { setPending(false); }
      },
      remove: async (variantId) => {
        if (pending) return { ok: false, error: "Please wait for the cart to finish syncing." };
        setPending(true);
        setError(null);
        try {
          if (mode === "account") return await applyAccountResult(await removeCartItem(variantId));
          setItems((current) => current.filter((item) => item.variantId !== variantId));
          return { ok: true };
        } catch {
          const message = "We couldn't remove the item. Please try again.";
          setError(message);
          return { ok: false, error: message };
        } finally { setPending(false); }
      },
      clear: async () => {
        setItems([]);
        setError(null);
        try {
          window.localStorage.removeItem(STORAGE_KEY);
          window.localStorage.removeItem(LEGACY_STORAGE_KEY);
        } catch { /* in-memory clear still works */ }
        if (mode === "account") {
          const result = await clearSavedCart();
          if (!result.ok) setError(result.error ?? "Your cart could not be cleared from your account.");
          else try { window.localStorage.setItem(ACCOUNT_SYNC_KEY, String(Date.now())); } catch { /* cross-tab refresh is best effort */ }
        }
      },
    };
  }, [items, hydrated, pending, error, mode]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = React.useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside <CartProvider>");
  return context;
}
