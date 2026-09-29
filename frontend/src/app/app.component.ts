import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';

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

  private apiUrl = 'http://localhost:3000/api/inventario/upload';

  constructor(private http: HttpClient) {}

  onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      this.errorMessage = null;
      this.respuestaBackend = null;
    }
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
      },
      error: (err) => {
        this.loading = false;
        if (err.error && err.error.message) {
          this.errorMessage = Array.isArray(err.error.message) 
            ? err.error.message.join(', ') 
            : err.error.message;
        } else {
          this.errorMessage = 'Ocurrió un error al subir el archivo al backend.';
        }
      }
    });
  }
}
