import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { API_BASE_URL } from '../../core/config';

interface RefillRequest {
  RefillRequestId: number;
  PrescriptionId: number;
  PatientId: number;
  Status: 'Pending' | 'Approved' | 'Fulfilled' | 'Rejected';
  RequestedAt: string;
  ApprovedAt?: string;
  ApprovedBy?: number;
  FulfilledAt?: string;
  FulfilledBy?: number;
  RejectionReason?: string;
  Notes?: string;
}

interface Prescription {
  PrescriptionId: number;
  PatientId: number;
  Medications: any[];
}

@Component({
  selector: 'app-refill-management',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './refill-management.component.html',
  styleUrl: './refill-management.component.css',
})
export class RefillManagementComponent {
  private http = inject(HttpClient);

  refillRequests = signal<RefillRequest[]>([]);
  prescriptions = signal<Map<number, Prescription>>(new Map());
  loading = signal(false);
  error = signal<string | null>(null);

  // Filter state
  selectedStatus = signal<string>('');
  searchPatientId = signal<string>('');

  // Computed filtered requests
  filteredRequests = computed(() => {
    let requests = this.refillRequests();

    // Filter by status
    if (this.selectedStatus()) {
      requests = requests.filter(r => r.Status === this.selectedStatus());
    }

    // Filter by patient ID
    if (this.searchPatientId()) {
      const patientId = +this.searchPatientId();
      requests = requests.filter(r => r.PatientId === patientId);
    }

    // Sort by request date (newest first)
    return requests.sort((a, b) =>
      new Date(b.RequestedAt).getTime() - new Date(a.RequestedAt).getTime()
    );
  });

  // Status counts
  statusCounts = computed(() => {
    const requests = this.refillRequests();
    return {
      total: requests.length,
      pending: requests.filter(r => r.Status === 'Pending').length,
      approved: requests.filter(r => r.Status === 'Approved').length,
      fulfilled: requests.filter(r => r.Status === 'Fulfilled').length,
      rejected: requests.filter(r => r.Status === 'Rejected').length,
    };
  });

  constructor() {
    this.loadRefillRequests();
  }

  /**
   * Load all refill requests from API
   */
  private loadRefillRequests(): void {
    this.loading.set(true);
    this.error.set(null);

    this.http.get<RefillRequest[]>(`${API_BASE_URL}/pharmacy/refill-requests`).subscribe({
      next: (requests) => {
        this.refillRequests.set(requests);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to load refill requests');
        console.error('Error:', err);
        this.loading.set(false);
      },
    });
  }

  /**
   * Get status badge color
   */
  getStatusColor(status: string): string {
    switch (status) {
      case 'Pending':
        return 'status-pending';
      case 'Approved':
        return 'status-approved';
      case 'Fulfilled':
        return 'status-fulfilled';
      case 'Rejected':
        return 'status-rejected';
      default:
        return '';
    }
  }

  /**
   * Get status icon
   */
  getStatusIcon(status: string): string {
    switch (status) {
      case 'Pending':
        return '⏳';
      case 'Approved':
        return '✅';
      case 'Fulfilled':
        return '📦';
      case 'Rejected':
        return '❌';
      default:
        return '';
    }
  }

  /**
   * Approve a refill request
   */
  approveRefill(refillId: number, approvedBy: number = 1): void {
    this.http.post(
      `${API_BASE_URL}/pharmacy/refill-requests/${refillId}/approve`,
      { ApprovedBy: approvedBy }
    ).subscribe({
      next: () => {
        this.loadRefillRequests();
      },
      error: (err) => {
        this.error.set('Failed to approve refill request');
        console.error('Error:', err);
      },
    });
  }

  /**
   * Fulfill a refill request
   */
  fulfillRefill(refillId: number, fulfilledBy: number = 1): void {
    this.http.post(
      `${API_BASE_URL}/pharmacy/refill-requests/${refillId}/fulfill`,
      { FulfilledBy: fulfilledBy }
    ).subscribe({
      next: () => {
        this.loadRefillRequests();
      },
      error: (err) => {
        this.error.set('Failed to fulfill refill request');
        console.error('Error:', err);
      },
    });
  }

  /**
   * Reject a refill request
   */
  rejectRefill(refillId: number, reason: string = ''): void {
    this.http.post(
      `${API_BASE_URL}/pharmacy/refill-requests/${refillId}/reject`,
      {
        RejectionReason: reason,
        RejectedBy: 1
      }
    ).subscribe({
      next: () => {
        this.loadRefillRequests();
      },
      error: (err) => {
        this.error.set('Failed to reject refill request');
        console.error('Error:', err);
      },
    });
  }

  /**
   * Format date for display
   */
  formatDate(dateStr: string): string {
    try {
      return new Date(dateStr).toLocaleDateString() + ' ' + new Date(dateStr).toLocaleTimeString();
    } catch {
      return dateStr;
    }
  }
}
