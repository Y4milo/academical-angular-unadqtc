import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class JwtService {

  constructor() { }

  isJWT(token: string): boolean {
    const parts = token.split('.');

    // Un JWT siempre tiene 3 partes separadas por puntos
    if (parts.length !== 3) {
      return false;
    }

    try {
      // Decodificar la cabecera (header)
      const header = JSON.parse(atob(parts[0]));

      // Confirmar que el tipo es "JWT"
      return header.typ === 'JWT' || header.typ === undefined; // a veces no lo ponen
    } catch (error) {
      return false;
    }
  }
}
