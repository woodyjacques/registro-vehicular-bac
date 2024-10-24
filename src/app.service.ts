import { Injectable } from '@nestjs/common';
import { google } from 'googleapis';
import * as dotenv from 'dotenv';
import { Readable } from 'stream';

dotenv.config();

@Injectable()
export class AppService {
  private sheets = google.sheets('v4');
  private auth: any;

  constructor() {
    this.initializeAuth();
  }

  private initializeAuth() {
    const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    const scopes = process.env.GOOGLE_SCOPES?.split(',');

    if (!clientEmail || !privateKey) {
      throw new Error("Faltan las variables de entorno GOOGLE_CLIENT_EMAIL o GOOGLE_PRIVATE_KEY.");
    }

    this.auth = new google.auth.JWT(
      clientEmail,
      null,
      privateKey,
      scopes
    );

    console.log("Autenticación inicializada.");
  }

  async uploadFileToDrive(documento: Express.Multer.File): Promise<string> {
    return new Promise((resolve, reject) => {
      const drive = google.drive({ version: 'v3', auth: this.auth });

      const fileMetadata = {
        name: documento.originalname,
        parents: [process.env.GOOGLE_DRIVE_FOLDER_ID],
      };

      const media = {
        mimeType: documento.mimetype,
        body: Readable.from(documento.buffer),
      };

      drive.files.create(
        {
          requestBody: fileMetadata,
          media: media,
          fields: 'id',
        },
        (error, file) => {
          if (error) {
            console.error('Error al subir archivo a Google Drive:', error);
            reject(error);
          } else {
            const fileId = file.data.id;

            drive.permissions.create({
              fileId: fileId,
              requestBody: {
                role: 'reader',
                type: 'anyone',
              }
            }, (error) => {
              if (error) {
                console.error('Error al configurar permisos en Google Drive:', error);
                reject(error);
              } else {
                const publicUrl = `https://drive.google.com/file/d/${fileId}/view`;
                resolve(publicUrl);
              }
            });
          }
        }
      );
    });
  }

  async handleData(placa: string, conductor: string, sucursal: string, fechaRegistro: string, uniqueIdentifier: string, documento?: Express.Multer.File) {
    const spreadsheetId = process.env.GOOGLE_SPREADSHEETID;

    try {
      let fileLink = '';
      if (documento) {
        fileLink = await this.uploadFileToDrive(documento);
      }

      const linkToSave = fileLink || '';

      const estado = 'Inspeccionar';
      const reportes = 'No reportado';
      const fechaSalida = 'No registrado';

      const response = await this.sheets.spreadsheets.values.append({
        auth: this.auth,
        spreadsheetId,
        range: 'Hoja 1',
        valueInputOption: 'USER_ENTERED',
        insertDataOption: 'INSERT_ROWS',
        requestBody: {
          values: [
            [
              sucursal,       
              placa,        
              conductor,      
              fechaRegistro,  
              uniqueIdentifier, 
              linkToSave,    
              estado,        
              reportes,             
              fechaSalida    
            ]
          ],
        },
      });

      console.log('Datos enviados a Google Sheets:', response.data);
    } catch (error) {
      console.error('Error al procesar datos o subir el archivo:', error.response?.data || error.message || error);
      throw new Error('Error al procesar datos o subir el archivo');
    }

    return { message: 'Datos procesados y almacenados correctamente en Google Sheets' };
  }

  async getDataFromSheet() {
    const spreadsheetId = process.env.GOOGLE_SPREADSHEETID;
    const range = 'Hoja 1';

    try {
      const response = await this.sheets.spreadsheets.values.get({
        auth: this.auth,
        spreadsheetId,
        range,
      });

      const rows = response.data.values;
      if (rows.length) {
        return rows;
      } else {
        return { message: 'No hay datos disponibles en la hoja.' };
      }
    } catch (error) {
      console.error('Error al obtener datos de Google Sheets:', error.response?.data || error.message || error);
      throw new Error('Error al obtener datos de Google Sheets');
    }
  }


}
