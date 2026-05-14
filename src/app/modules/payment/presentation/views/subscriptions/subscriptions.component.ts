import { Component, OnInit, inject, signal } from '@angular/core';
import { NgClass } from '@angular/common';
import { PlanesClienteService } from '../../../infrastructure/planes-cliente.service';

interface ClientPlan {
  id: string;
  type: string;
  name: string;
  monthlyPrice: number;
  description: string;
  reservationsPerMonth: number | null;
}

@Component({
  selector: 'app-subscriptions',
  standalone: true,
  imports: [NgClass],
  templateUrl: './subscriptions.component.html',
  styleUrl: './subscriptions.component.css',
})
export class SubscriptionsComponent implements OnInit {
  private readonly planesService = inject(PlanesClienteService);

  protected readonly plans = signal<ClientPlan[]>([]);
  protected readonly loading = signal(true);

  ngOnInit(): void {
    this.planesService.getAll().subscribe({
      next: (data) => {
        this.plans.set(data as ClientPlan[]);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }
}
