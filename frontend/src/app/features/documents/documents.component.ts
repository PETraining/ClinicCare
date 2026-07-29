import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs';

import { DocumentsPanelComponent } from './documents-panel.component';

@Component({
  selector: 'app-documents',
  standalone: true,
  imports: [DocumentsPanelComponent],
  templateUrl: './documents.component.html',
  styleUrl: './documents.component.css',
})
export class DocumentsComponent {
  private route = inject(ActivatedRoute);

  patientId = toSignal(
    this.route.queryParamMap.pipe(map((params) => {
      const raw = params.get('patientId');
      return raw ? Number(raw) : undefined;
    })),
    { initialValue: undefined },
  );

  referralId = toSignal(
    this.route.queryParamMap.pipe(map((params) => {
      const raw = params.get('referralId');
      return raw ? Number(raw) : undefined;
    })),
    { initialValue: undefined },
  );
}
