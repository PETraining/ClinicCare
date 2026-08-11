import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { DocumentService } from '../../core/services/document.service';

@Component({
  selector: 'app-document-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './document-list.component.html',
  styleUrl: './document-list.component.css',
})
export class DocumentListComponent implements OnInit {
  private documentService = inject(DocumentService);

  documents = this.documentService.documents;

  ngOnInit(): void {
    this.documentService.loadMyDocuments();
  }

  download(id: number, filename: string): void {
    this.documentService.downloadDocument(id, filename);
  }
}
