import { Injectable } from '@nestjs/common';
import { AppService } from 'src/app.service';
import { google } from 'googleapis';

@Injectable()
export class InsRegistroEntradaService {
  private sheets: any;
  private auth: any;

  constructor(private readonly appService: AppService) {
    this.auth = this.appService['auth'];
    this.sheets = google.sheets({ version: 'v4', auth: this.auth });
  }

  async processRegistroEntrada(
    revisiones: [],
    observacion: string,
    lastPlacaInfo: string
  ) {
    const spreadsheetId = process.env.GOOGLE_INSPECCIONSALIDAS;

    try {

      revisiones = this.processJSON(revisiones);
      const arrays = this.initializeArrays({ revisiones });
      const values = this.buildValues({ observacion, ...arrays });

      const rowNumber = parseInt(lastPlacaInfo, 10); 
      const startColumn = 'FG'; 
      const range = `Hoja 1!${startColumn}${rowNumber}`; 

      await this.sheets.spreadsheets.values.update({
        auth: this.auth,
        spreadsheetId,
        range,
        valueInputOption: 'RAW',
        requestBody: {
          values, 
        },
      });

      console.log('Datos enviados correctamente a Google Sheets.');
      return { message: 'Datos procesados y almacenados correctamente en Google Sheets' };
    } catch (error) {
      console.error('Error al procesar datos o subir el archivo:', error.response?.data || error.message || error);
      throw new Error('Error al procesar datos o subir el archivo');
    }
  }

  private processJSON(data: any): any {
    if (typeof data === 'string') {
      try {
        return JSON.parse(data);
      } catch (error) {
        console.error('Error al analizar la cadena JSON:', error);
        return null;
      }
    }
    return data;
  }

  private initializeArrays({
    revisiones
  }: any) {
    return {
      revisiones1: revisiones[0],
      revisiones2: revisiones[1],
      revisiones3: revisiones[2],
      revisiones4: revisiones[3],
      revisiones5: revisiones[4],
      revisiones6: revisiones[5],
      revisiones7: revisiones[6],
      revisiones8: revisiones[7],
      revisiones9: revisiones[8],
      revisiones10: revisiones[9],
      revisiones11: revisiones[10],
      revisiones12: revisiones[11],
    };
  }

  private buildValues({ observacion, ...arrays }: any) {
    const {
      revisiones1, revisiones2, revisiones3, revisiones4,
      revisiones5, revisiones6, revisiones7, revisiones8,
      revisiones9, revisiones10, revisiones11, revisiones12,
    } = arrays;

    return [
      [
        revisiones1?.descripcion, revisiones1?.opcion ? "sí" : "no",
        revisiones2?.descripcion, revisiones2?.opcion ? "sí" : "no",
        revisiones3?.descripcion, revisiones3?.opcion ? "sí" : "no",
        revisiones4?.descripcion, revisiones4?.opcion ? "sí" : "no",
        revisiones5?.descripcion, revisiones5?.opcion ? "sí" : "no",
        revisiones6?.descripcion, revisiones6?.opcion ? "sí" : "no",
        revisiones7?.descripcion, revisiones7?.opcion ? "sí" : "no",
        revisiones8?.descripcion, revisiones8?.opcion ? "sí" : "no",
        revisiones9?.descripcion, revisiones9?.opcion ? "sí" : "no",
        revisiones10?.descripcion, revisiones10?.opcion ? "sí" : "no",
        revisiones11?.descripcion, revisiones11?.opcion ? "sí" : "no",
        revisiones12?.descripcion, revisiones12?.opcion ? "sí" : "no",
        observacion
      ],
    ];
  }


}
