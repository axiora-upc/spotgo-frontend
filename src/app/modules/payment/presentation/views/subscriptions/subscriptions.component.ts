import { Component, OnInit } from '@angular/core';
import { NgClass } from '@angular/common';
import { ClientPlansService } from '../../../infrastructure/client-plans.service';

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
  plans: ClientPlan[] = [];
  loading = true;

  constructor(private planesClienteService: ClientPlansService) {}

  ngOnInit(): void {
    this.planesClienteService.getAll().subscribe({
      next: (data) => {
        this.plans = data as ClientPlan[];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }
}
