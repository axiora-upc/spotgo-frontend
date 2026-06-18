import { Component, OnInit, inject, computed } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { MatIcon } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { TranslatePipe } from '@ngx-translate/core';
import { MonitoringStore } from '../../../application/monitoring.store';
import { ParkingResource } from '../../../infrastructure/monitoring-api';
import { ParkingDetailsDialog } from './components/parking-details-dialog/parking-details-dialog';
import { FavoritesStore } from '../../../../profiles/application/favorites.store';
import { PaymentStore } from '../../../../payment/application/payment.store';
import { CurrentUserService } from '../../../../../shared/services/current-user.service';

interface ParkingWithPosition extends ParkingResource {
  mapX: number;
  mapY: number;
}

@Component({
  selector: 'app-dashboard',
  imports: [CurrencyPipe, MatIcon, MatDialogModule, TranslatePipe],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  protected readonly store       = inject(MonitoringStore);
  private  readonly dialog       = inject(MatDialog);
  private  readonly favoritesStore = inject(FavoritesStore);
  private  readonly paymentStore   = inject(PaymentStore);
  private  readonly currentUser    = inject(CurrentUserService);

  protected readonly stats = computed(() => {
    const parkings = this.store.parkings();
    
    // Calculate spots available nearby from all parking facilities
    const availableNearby = parkings.reduce((acc, p) => acc + p.availableSpaces, 0);

    // Filter and count only active reservations in session
    const activeReservations = this.store.userReservations().filter(r => r.status === 'active').length;

    // Count of dynamic favorites from backend favorite-store
    const savedLocations = this.favoritesStore.favorites().length;

    // Actual monthly savings from the current client's receipts.
    const avgSavings = this.paymentStore.currentMonthSavings();

    return {
      availableNearby,
      activeReservations,
      savedLocations,
      avgSavings
    };
  });

  private readonly positionCache = new Map<string, { mapX: number; mapY: number }>();

  protected readonly parkingsWithPosition = computed<ParkingWithPosition[]>(() => {
    return this.store.parkings().map((parking) => {
      if (!this.positionCache.has(parking.id)) {
        this.positionCache.set(parking.id, {
          mapX: this.generateRandomPosition(),
          mapY: this.generateRandomPosition(),
        });
      }
      const pos = this.positionCache.get(parking.id)!;
      return {
        ...parking,
        mapX: pos.mapX,
        mapY: pos.mapY,
      };
    });
  });

  ngOnInit(): void {
    this.store.loadParkings();
    this.store.loadUserReservations();
    this.favoritesStore.loadFavoritesByClientId(this.currentUser.clientId);
    this.paymentStore.loadSubscriptionByClientId(this.currentUser.clientId);
    this.paymentStore.loadPlans();
    this.paymentStore.loadReceiptsByClientId(this.currentUser.clientId);
  }

  protected openParkingDetails(parking: ParkingResource): void {
    this.store.selectParking(parking);

    const dialogRef = this.dialog.open(ParkingDetailsDialog, {
      data: parking,
      width: '450px',
      maxWidth: '95vw',
      panelClass: 'custom-dialog-container',
    });

    dialogRef.afterClosed().subscribe(() => {
      this.store.selectParking(null);
    });
  }

  protected generateRandomPosition(): number {
    // Generate position between 15% and 85% to keep it away from edges
    return 15 + Math.random() * 70;
  }

  protected getBubbleClass(availableSpaces: number): string {
    if (availableSpaces === 0) return 'full';
    if (availableSpaces <= 20) return 'limited';
    return 'available';
  }
}
