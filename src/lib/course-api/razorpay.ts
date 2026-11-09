const CHECKOUT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

export interface RazorpayOptions {
  key: string;
  subscription_id: string;
  name: string;
  description?: string;
  handler?: (response: Record<string, string>) => void;
  prefill?: { name?: string; email?: string };
  modal?: { ondismiss?: () => void };
}

interface RazorpayInstance {
  open(): void;
  on(event: string, cb: (response: unknown) => void): void;
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

let loading: Promise<void> | null = null;

/** Load Razorpay's public checkout.js once. */
export function loadRazorpay(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("browser only"));
  if (window.Razorpay) return Promise.resolve();
  if (loading) return loading;
  loading = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = CHECKOUT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      loading = null;
      reject(new Error("Could not load Razorpay checkout"));
    };
    document.head.appendChild(script);
  });
  return loading;
}

export async function openRazorpay(options: RazorpayOptions): Promise<void> {
  await loadRazorpay();
  if (!window.Razorpay) throw new Error("Razorpay checkout is unavailable");
  new window.Razorpay(options).open();
}
