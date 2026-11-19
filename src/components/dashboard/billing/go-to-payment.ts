import { toast } from "sonner";

/** Leaves for the payment page; the button stays busy until it loads. */
export function goToPayment(payUrl: string, message: string) {
	toast.message(message);
	window.location.assign(payUrl);
}
