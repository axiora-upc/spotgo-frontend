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
import { Component, OnInit, inject, computed, effect, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { PaymentStore } from '../../../application/payment.store';
import { Receipt } from '../../../domain/model/receipt.entity';
import { CurrentUserService } from '../../../../../shared/services/current-user.service';

@Component({
  selector: 'app-receipts',
  standalone: true,
  imports: [DecimalPipe, FormsModule, TranslatePipe],
  templateUrl: './receipts.component.html',
  styleUrl: './receipts.component.css',
})
export class ReceiptsComponent implements OnInit {

  /*
    The store is the only dependency this component needs.
    It exposes receipts, loading, and error as readonly signals.
  */
  protected readonly store      = inject(PaymentStore);
  private  readonly currentUser = inject(CurrentUserService);

  /*
    searchQuery drives the client-side filter.
    The user types in the search bar and the list updates instantly
    without any new HTTP call.
  */
  protected readonly searchQuery = signal('');
  protected readonly currentPage = signal(1);
  protected readonly pageSize = 5;

  /*
    filteredReceipts re-evaluates every time receipts or searchQuery changes.
    It filters by location name, invoice number, or booking code —
    matching the placeholder text shown in the search bar.
  */
  protected readonly filteredReceipts = computed(() => {
    const query = this.normalizeSearch(this.searchQuery());
    if (!query) return this.store.receipts();

    return this.store.receipts().filter((r) => {
      const searchableText = [
        r.locationName,
        r.invoiceNumber,
        r.bookingCode,
        r.paymentMethod,
        r.status,
        this.formatDate(r.date),
        this.formatTime(r.date),
        this.formatDuration(r.durationHours, r.durationMinutes),
        `S/.${r.amount.toFixed(2)}`,
        r.amount.toFixed(2),
      ].join(' ');

      return this.normalizeSearch(searchableText).includes(query);
    });
  });

  protected readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.filteredReceipts().length / this.pageSize))
  );

  protected readonly pagedReceipts = computed(() => {
    const safePage = Math.min(this.currentPage(), this.totalPages());
    const start = (safePage - 1) * this.pageSize;
    return this.filteredReceipts().slice(start, start + this.pageSize);
  });

  protected readonly pageStart = computed(() => {
    if (this.filteredReceipts().length === 0) return 0;
    return (Math.min(this.currentPage(), this.totalPages()) - 1) * this.pageSize + 1;
  });

  protected readonly pageEnd = computed(() =>
    Math.min(this.pageStart() + this.pagedReceipts().length - 1, this.filteredReceipts().length)
  );

  protected readonly shouldShowPagination = computed(() =>
    this.filteredReceipts().length > this.pageSize
  );

  protected readonly isFirstPage = computed(() =>
    this.currentPage() === 1
  );

  protected readonly isLastPage = computed(() =>
    this.currentPage() === this.totalPages()
  );

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
  protected readonly totalSpent = computed(() => {
    const raw = this.store.receipts().reduce((sum, r) => sum + Math.round(r.amount * 100) / 100, 0);
    return Math.round(raw * 100) / 100;
  });

  /*
    Sum of amounts for receipts in the current calendar month.
    Shown in the "This month" stat card.
  */
  protected readonly thisMonthSpent = computed(() => {
    const now = new Date();
    const year  = now.getFullYear();
    const month = now.getMonth(); // 0-indexed

    const raw = this.store.receipts()
      .filter((r) => {
        const d = new Date(r.date);
        return d.getFullYear() === year && d.getMonth() === month;
      })
      .reduce((sum, r) => sum + Math.round(r.amount * 100) / 100, 0);
    return Math.round(raw * 100) / 100;
  });

  /* ── Lifecycle ────────────────────────────────────────────────────────── */

  ngOnInit(): void {
    this.store.loadReceiptsByClientId(this.currentUser.clientId);
  }

  constructor() {
    effect(() => {
      this.searchQuery();
      this.currentPage.set(1);
    }, { allowSignalWrites: true });

    effect(() => {
      if (this.currentPage() > this.totalPages()) {
        this.currentPage.set(this.totalPages());
      }
    }, { allowSignalWrites: true });
  }

  /* ── Formatting helpers ───────────────────────────────────────────────── */

  /*
    Formats a receipt date string ("2026-04-12") into "Apr 12, 2026".
    Used in the receipt list rows.
  */
  protected formatDate(dateStr: string): string {
    const d = this.toLocalDate(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  protected formatTime(dateStr: string): string {
    if (!dateStr.includes('T')) return '';
    const d = new Date(dateStr);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }

  private toLocalDate(dateStr: string): Date {
    if (dateStr.includes('T')) return new Date(dateStr);
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d);
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

  protected goToPreviousPage(): void {
    this.currentPage.update((page) => Math.max(1, page - 1));
  }

  protected goToNextPage(): void {
    this.currentPage.update((page) => Math.min(this.totalPages(), page + 1));
  }

  protected onDownloadPdf(receipt: Receipt): void {
    const printWindow = window.open('', '_blank', 'width=720,height=900');
    if (!printWindow) return;

    printWindow.document.open();
    printWindow.document.write(this.buildReceiptPrintHtml(receipt));
    printWindow.document.close();
    printWindow.focus();

    printWindow.onload = () => {
      printWindow.print();
    };
  }

  protected onEmailReceipt(receipt: Receipt): void {
    const subject = `SpotGo receipt ${receipt.invoiceNumber}`;
    const body = this.buildReceiptText(receipt);
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }

  private normalizeSearch(value: string): string {
    return value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  private buildReceiptText(receipt: Receipt): string {
    const time = this.formatTime(receipt.date);
    const dateTime = time ? `${this.formatDate(receipt.date)} ${time}` : this.formatDate(receipt.date);

    return [
      'SpotGo Digital Receipt',
      '',
      `Invoice: ${receipt.invoiceNumber}`,
      `Booking: ${receipt.bookingCode}`,
      `Location: ${receipt.locationName}`,
      `Date: ${dateTime}`,
      `Duration: ${this.formatDuration(receipt.durationHours, receipt.durationMinutes)}`,
      `Payment method: ${receipt.paymentMethod}`,
      `Status: ${receipt.status}`,
      `Amount: S/.${receipt.amount.toFixed(2)}`,
    ].join('\n');
  }

  private buildReceiptPrintHtml(receipt: Receipt): string {
    const rows = this.buildReceiptText(receipt)
      .split('\n')
      .filter(Boolean)
      .slice(1)
      .map((line) => {
        const [label, ...valueParts] = line.split(': ');
        return `
          <tr>
            <th>${this.escapeHtml(label)}</th>
            <td>${this.escapeHtml(valueParts.join(': '))}</td>
          </tr>
        `;
      })
      .join('');

    return `
      <!doctype html>
      <html>
        <head>
          <title>${this.escapeHtml(receipt.invoiceNumber)}</title>
          <style>
            body {
              color: #111827;
              font-family: Arial, sans-serif;
              margin: 40px;
            }
            .receipt {
              border: 1px solid #d1d5db;
              border-radius: 12px;
              padding: 28px;
              max-width: 640px;
            }
            h1 {
              font-size: 24px;
              margin: 0 0 6px;
            }
            .subtitle {
              color: #6b7280;
              margin: 0 0 24px;
            }
            table {
              border-collapse: collapse;
              width: 100%;
            }
            th,
            td {
              border-top: 1px solid #e5e7eb;
              padding: 12px 0;
              text-align: left;
              vertical-align: top;
            }
            th {
              color: #6b7280;
              font-weight: 600;
              width: 38%;
            }
            .amount {
              color: #1a237e;
              font-size: 24px;
              font-weight: 700;
              margin-top: 24px;
              text-align: right;
            }
            @media print {
              body { margin: 0; }
              .receipt { border: none; }
            }
          </style>
        </head>
        <body>
          <main class="receipt">
            <h1>SpotGo Digital Receipt</h1>
            <p class="subtitle">${this.escapeHtml(receipt.invoiceNumber)}</p>
            <table>${rows}</table>
            <p class="amount">S/.${receipt.amount.toFixed(2)}</p>
          </main>
        </body>
      </html>
    `;
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}
