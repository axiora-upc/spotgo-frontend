/*
  ReceiptsComponent is the presentation layer for the receipts view.

  Responsibilities:
    - Load receipts from the store on init.
    - Expose computed signals for summary stats (total, spent, this month).
    - Handle the search filter locally via a signal.
    - Provide helpers for formatting (date, duration, status badge class).

  The component never calls PaymentApi directly.
  All data comes from PaymentStore signals.
*/
import { Component, OnInit, inject, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { PaymentStore } from '../../../application/payment.store';
import { Receipt } from '../../../domain/model/receipt.entity';

@Component({
  selector: 'app-receipts',
  standalone: true,
  imports: [FormsModule, TranslatePipe],
  templateUrl: './receipts.component.html',
  styleUrl: './receipts.component.css',
})
export class ReceiptsComponent implements OnInit {

  /*
    The store is the only dependency this component needs.
    It exposes receipts, loading, and error as readonly signals.
  */
  protected readonly store = inject(PaymentStore);

  /*
    searchQuery drives the client-side filter.
    The user types in the search bar and the list updates instantly
    without any new HTTP call.
  */
  protected readonly searchQuery = signal('');

  /*
    filteredReceipts re-evaluates every time receipts or searchQuery changes.
    It filters by location name, invoice number, or booking code —
    matching the placeholder text shown in the search bar.
  */
  protected readonly filteredReceipts = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    if (!query) return this.store.receipts();

    return this.store.receipts().filter((r) =>
      r.locationName.toLowerCase().includes(query) ||
      r.invoiceNumber.toLowerCase().includes(query) ||
      r.bookingCode.toLowerCase().includes(query)
    );
  });

  /* ── Summary stats ────────────────────────────────────────────────────── */

  /*
    Total number of receipts for this client.
    Shown in the top-left stat card.
  */
  protected readonly totalReceipts = computed(() =>
    this.store.receipts().length
  );

  /*
    Sum of all receipt amounts (paid and refunded).
    Shown in the "Total spent" stat card.
  */
  protected readonly totalSpent = computed(() =>
    this.store.receipts().reduce((sum, r) => sum + r.amount, 0)
  );

  /*
    Sum of amounts for receipts in the current calendar month.
    Shown in the "This month" stat card.
  */
  protected readonly thisMonthSpent = computed(() => {
    const now = new Date();
    const year  = now.getFullYear();
    const month = now.getMonth(); // 0-indexed

    return this.store.receipts()
      .filter((r) => {
        const d = new Date(r.date);
        return d.getFullYear() === year && d.getMonth() === month;
      })
      .reduce((sum, r) => sum + r.amount, 0);
  });

  /* ── Lifecycle ────────────────────────────────────────────────────────── */

  ngOnInit(): void {
    /*
      cli-001 is hardcoded for now — will be replaced with the
      logged-in client id once authentication is implemented.
    */
    this.store.loadReceiptsByClientId('cli-001');
  }

  /* ── Formatting helpers ───────────────────────────────────────────────── */

  /*
    Formats a receipt date string ("2026-04-12") into "Apr 12, 2026".
    Used in the receipt list rows.
  */
  protected formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  /*
    Formats hours and minutes into "4h 00m".
    Pads minutes with a leading zero when needed.
  */
  protected formatDuration(hours: number, minutes: number): string {
    const mm = minutes.toString().padStart(2, '0');
    return `${hours}h ${mm}m`;
  }

  /*
    Returns the CSS class that controls the badge colour for each status.
    'paid'     → green badge
    'refunded' → orange badge
    'pending'  → grey badge
  */
  protected statusClass(receipt: Receipt): string {
    return `badge badge--${receipt.status}`;
  }

  /*
    Simulates downloading a PDF receipt.
    In a real app this would call an endpoint that returns a PDF blob.
  */
  protected onDownloadPdf(receipt: Receipt): void {
    console.log('Download PDF for', receipt.invoiceNumber);
  }

  /*
    Simulates emailing a receipt to the client.
    In a real app this would POST to an endpoint with the receipt id.
  */
  protected onEmailReceipt(receipt: Receipt): void {
    console.log('Email receipt', receipt.invoiceNumber);
  }
}
