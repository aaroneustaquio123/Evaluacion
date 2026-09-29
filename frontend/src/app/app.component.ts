import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  selectedFile: File | null = null;
  loading: boolean = false;
  respuestaBackend: any = null;
  errorMessage: string | null = null;
  isDragging: boolean = false;
  activeTab: 'dashboard' | 'json' = 'dashboard';
  copiedJson: boolean = false;
  imageLoaded: boolean = true;

  private apiUrl = (window as any).API_URL || 'http://localhost:3000/api/inventario/upload';

  constructor(private http: HttpClient) {}

  onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (file) {
      this.setFile(file);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
    
    if (event.dataTransfer && event.dataTransfer.files.length > 0) {
      const file = event.dataTransfer.files[0];
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        this.setFile(file);
      } else {
        this.errorMessage = 'Formato de archivo no válido. Solo se permiten archivos Excel (.xlsx).';
      }
    }
  }

  private setFile(file: File): void {
    this.selectedFile = file;
    this.errorMessage = null;
    this.respuestaBackend = null;
  }

  removeFile(): void {
    this.selectedFile = null;
    this.errorMessage = null;
    this.respuestaBackend = null;
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  subirArchivo(): void {
    if (!this.selectedFile) {
      this.errorMessage = 'Por favor seleccione un archivo .xlsx primero.';
      return;
    }

    this.loading = true;
    this.errorMessage = null;
    this.respuestaBackend = null;

    const formData = new FormData();
    formData.append('file', this.selectedFile);

    this.http.post<any>(this.apiUrl, formData).subscribe({
      next: (res) => {
        this.respuestaBackend = res;
        this.loading = false;
        this.activeTab = 'dashboard';
      },
      error: (err) => {
        this.loading = false;
        if (err.error && err.error.message) {
          this.errorMessage = Array.isArray(err.error.message) 
            ? err.error.message.join(', ') 
            : err.error.message;
        } else {
          this.errorMessage = 'Ocurrió un error al conectar con el servidor backend.';
        }
      }
    });
  }

  copyJson(): void {
    if (!this.respuestaBackend) return;
    const jsonStr = JSON.stringify(this.respuestaBackend, null, 2);
    navigator.clipboard.writeText(jsonStr).then(() => {
      this.copiedJson = true;
      setTimeout(() => {
        this.copiedJson = false;
      }, 2000);
    });
  }

  onImageError(): void {
    this.imageLoaded = false;
  }

  getObjectKeys(obj: any): string[] {
    return obj ? Object.keys(obj) : [];
  }
}

