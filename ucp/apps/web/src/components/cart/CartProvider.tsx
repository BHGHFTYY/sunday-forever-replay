"use client";

import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState,
  type ReactNode,
} from "react";
import { track } from "@ucp/core";
import type { Cart, CartInputLine, FulfilmentMethod } from "@ucp/core";

/**
 * Cart state.
 *
 * The browser holds only `(kind, id, quantity)`. Prices, discounts,
 * delivery fees, loyalty maths and stock clamping all come back from the
 * server, which re-derives them from the catalogue on every change.
 *
 * That split is what makes a client-side cart safe: editing local storage
 * changes what you asked for, never what you are charged. It also means
 * the cart survives a reload and works before sign-in.
 *
 * Item count updates optimistically so the header badge responds
 * instantly; money never does, because a number that corrects itself a
 * moment later is worse than a number that arrives a moment late.
 */

const STORAGE_KEY = "ucp.cart.v1";
const MAX_LINE_QUANTITY = 20;

interface CartState {
  lines: CartInputLine[];
  cart: Cart | null;
  itemCount: number;
  pending: boolean;
  error: string | null;
  fulfilment: FulfilmentMethod;
  branchId: string | null;
  promoCode: string | null;
  pointsRequested: number;
}

interface CartActions {
  add(line: CartInputLine, meta?: { source?: string; name?: string; price?: number }): void;
  setQuantity(kind: CartInputLine["kind"], id: string, quantity: number): void;
  remove(kind: CartInputLine["kind"], id: string): void;
  clear(): void;
  setFulfilment(method: FulfilmentMethod, branchId?: string | null): void;
  applyPromo(code: string | null): void;
  setPoints(points: number): void;
  refresh(): void;
  quantityOf(kind: CartInputLine["kind"], id: string): number;
}

const CartContext = createContext<(CartState & CartActions) | null>(null);

function readStored(): CartInputLine[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Validate rather than trust: corrupted or hand-edited storage must not
    // be able to put a malformed line into a checkout request.
    return parsed.flatMap((item): CartInputLine[] => {
      if (typeof item !== "object" || item === null) return [];
      const line = item as Partial<CartInputLine>;
      if (line.kind !== "product" && line.kind !== "bundle") return [];
      if (typeof line.id !== "string" || !line.id) return [];
      const quantity = Number(line.quantity);
      if (!Number.isFinite(quantity) || quantity < 1) return [];
      return [{ kind: line.kind, id: line.id, quantity: Math.min(MAX_LINE_QUANTITY, Math.floor(quantity)) }];
    });
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartInputLine[]>([]);
  const [cart, setCart] = useState<Cart | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fulfilment, setFulfilmentState] = useState<FulfilmentMethod>("delivery");
  const [branchId, setBranchId] = useState<string | null>(null);
  const [promoCode, setPromoCode] = useState<string | null>(null);
  const [pointsRequested, setPointsRequested] = useState(0);
  const [hydrated, setHydrated] = useState(false);

  // Only the newest pricing response may win, so a slow earlier request
  // cannot overwrite a newer cart.
  const requestId = useRef(0);

  useEffect(() => {
    setLines(readStored());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      // Storage can be unavailable (private mode, quota). The cart still
      // works for this session; it just will not survive a reload.
    }
  }, [lines, hydrated]);

  const price = useCallback(async () => {
    if (!hydrated) return;
    const id = ++requestId.current;

    if (lines.length === 0) {
      setCart(null);
      setError(null);
      setPending(false);
      return;
    }

    setPending(true);
    try {
      const response = await fetch("/api/cart", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ lines, fulfilment, branchId, promoCode, points: pointsRequested }),
      });
      if (!response.ok) throw new Error(`pricing_failed_${response.status}`);
      const priced = (await response.json()) as Cart;
      if (id !== requestId.current) return;
      setCart(priced);
      setError(null);
    } catch (cause) {
      if (id !== requestId.current) return;
      setError(cause instanceof Error ? cause.message : "unknown");
    } finally {
      if (id === requestId.current) setPending(false);
    }
  }, [lines, fulfilment, branchId, promoCode, pointsRequested, hydrated]);

  useEffect(() => {
    void price();
  }, [price]);

  const actions = useMemo<CartActions>(() => ({
    add(line, meta) {
      setLines((current) => {
        const existing = current.find((l) => l.kind === line.kind && l.id === line.id);
        if (existing) {
          return current.map((l) =>
            l.kind === line.kind && l.id === line.id
              ? { ...l, quantity: Math.min(MAX_LINE_QUANTITY, l.quantity + line.quantity) }
              : l,
          );
        }
        return [
          ...current,
          { ...line, quantity: Math.min(MAX_LINE_QUANTITY, Math.max(1, line.quantity)) },
        ];
      });

      track({
        name: "add_to_cart",
        source: meta?.source ?? "unknown",
        item: {
          id: line.id,
          name: meta?.name ?? line.id,
          price: meta?.price ?? 0,
          quantity: line.quantity,
        },
      });
    },

    setQuantity(kind, id, quantity) {
      setLines((current) =>
        quantity <= 0
          ? current.filter((l) => !(l.kind === kind && l.id === id))
          : current.map((l) =>
              l.kind === kind && l.id === id
                ? { ...l, quantity: Math.min(MAX_LINE_QUANTITY, Math.floor(quantity)) }
                : l,
            ),
      );
    },

    remove(kind, id) {
      setLines((current) => {
        const line = current.find((l) => l.kind === kind && l.id === id);
        if (line) {
          track({ name: "remove_from_cart", item: { id, name: id, price: 0, quantity: line.quantity } });
        }
        return current.filter((l) => !(l.kind === kind && l.id === id));
      });
    },

    clear() {
      setLines([]);
      setPromoCode(null);
      setPointsRequested(0);
    },

    setFulfilment(method, branch) {
      setFulfilmentState(method);
      setBranchId(branch ?? null);
      track({ name: "add_shipping_info", method });
      if (method === "pickup" && branch) track({ name: "pickup_branch_selected", branchId: branch });
    },

    applyPromo(code) {
      setPromoCode(code ? code.trim().toUpperCase() : null);
    },

    setPoints(points) {
      setPointsRequested(Math.max(0, Math.floor(points)));
    },

    refresh() {
      void price();
    },

    quantityOf(kind, id) {
      return lines.find((l) => l.kind === kind && l.id === id)?.quantity ?? 0;
    },
  }), [lines, price]);

  const itemCount = useMemo(() => lines.reduce((sum, line) => sum + line.quantity, 0), [lines]);

  const value = useMemo(
    () => ({
      lines, cart, itemCount, pending, error,
      fulfilment, branchId, promoCode, pointsRequested,
      ...actions,
    }),
    [lines, cart, itemCount, pending, error, fulfilment, branchId, promoCode, pointsRequested, actions],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside <CartProvider>");
  return context;
}

export function useOptionalCart() {
  return useContext(CartContext);
}
