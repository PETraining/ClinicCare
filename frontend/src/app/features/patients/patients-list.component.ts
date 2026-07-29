import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { PatientService } from '../../core/services/patient.service';

@Component({
  selector: 'app-patients-list',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './patients-list.component.html',
  styleUrl: './patients-list.component.css',
})
export class PatientsListComponent implements OnInit {
  patientService = inject(PatientService);
  searchTerm = '';

  ngOnInit(): void {
    this.patientService.search();
  }

  onSearch(): void {
    this.patientService.search(this.searchTerm || undefined);
  }
}
