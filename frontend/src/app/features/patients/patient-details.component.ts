import { Component, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs';

import { Insurance, InsuranceCreate } from '../../core/models/patient.model';
import { PatientService } from '../../core/services/patient.service';
import { DocumentsPanelComponent } from '../documents/documents-panel.component';

function blankInsuranceForm(): InsuranceCreate {
  return {
    InsurerName: '',
    PolicyNumber: '',
    GroupNumber: null,
    MemberId: '',
    EffectiveDate: '',
    TerminationDate: null,
  };
}

@Component({
  selector: 'app-patient-details',
  standalone: true,
  imports: [RouterLink, DocumentsPanelComponent, FormsModule],
  templateUrl: './patient-details.component.html',
  styleUrl: './patient-details.component.css',
})
export class PatientDetailsComponent {
  patientService = inject(PatientService);
  private route = inject(ActivatedRoute);

  patientId = toSignal(
    this.route.paramMap.pipe(map((params) => Number(params.get('id')))),
    { initialValue: 0 },
  );

  editingInsurance = signal<Insurance | null>(null);
  showInsuranceForm = signal(false);
  insuranceForm: InsuranceCreate = blankInsuranceForm();
  insuranceError = signal<string | null>(null);
  insuranceSubmitting = signal(false);

  constructor() {
    effect(() => {
      const id = this.patientId();
      if (id) {
        this.patientService.loadById(id);
      }
    });
  }

  startAddInsurance(): void {
    this.insuranceForm = blankInsuranceForm();
    this.editingInsurance.set(null);
    this.insuranceError.set(null);
    this.showInsuranceForm.set(true);
  }

  startEditInsurance(record: Insurance): void {
    this.insuranceForm = {
      InsurerName: record.InsurerName,
      PolicyNumber: record.PolicyNumber,
      GroupNumber: record.GroupNumber,
      MemberId: record.MemberId,
      EffectiveDate: record.EffectiveDate,
      TerminationDate: record.TerminationDate,
    };
    this.editingInsurance.set(record);
    this.insuranceError.set(null);
    this.showInsuranceForm.set(true);
  }

  cancelInsuranceForm(): void {
    this.showInsuranceForm.set(false);
    this.insuranceError.set(null);
  }

  submitInsurance(): void {
    const patientId = this.patientId();
    if (!patientId) {
      return;
    }
    this.insuranceError.set(null);
    this.insuranceSubmitting.set(true);
    const editing = this.editingInsurance();
    const request = editing
      ? this.patientService.updateInsurance(patientId, editing.InsuranceId, this.insuranceForm)
      : this.patientService.createInsurance(patientId, this.insuranceForm);
    request.subscribe({
      next: () => {
        this.insuranceSubmitting.set(false);
        this.showInsuranceForm.set(false);
        this.editingInsurance.set(null);
      },
      error: (err) => {
        this.insuranceSubmitting.set(false);
        this.insuranceError.set(err?.error?.detail ?? 'Failed to save insurance record.');
      },
    });
  }

  deleteInsuranceRecord(record: Insurance): void {
    const patientId = this.patientId();
    if (!patientId || !confirm(`Delete insurance record from ${record.InsurerName}?`)) {
      return;
    }
    this.patientService.deleteInsurance(patientId, record.InsuranceId).subscribe({
      error: (err) => {
        this.insuranceError.set(err?.error?.detail ?? 'Failed to delete insurance record.');
      },
    });
  }
}
