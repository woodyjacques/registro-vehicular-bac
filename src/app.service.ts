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

  async uploadFileToDrive(documento: Express.Multer.File) {
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

  async handleData(
    placa: string,
    conductor: string,
    sucursal: string,
    tipoVehiculo: string,
    horaSalida: string,
    odometroSalida: string,
    fechaRegistro: string,
    uniqueIdentifier: string,
    llantasParte1?: any[],
    llantasParte2?: any[],
    fluidos?: any[],
    parametrosVisuales?: any[],
    luces?: any[],
    insumos?: any[],
    documentacion?: any[],
    danosCarroceria?: any[]
  ) {
    const spreadsheetId = process.env.GOOGLE_SPREADSHEETID;

    try {
      // Función para transformar valores booleanos en "Sí" o "No"
      const formatBoolean = (value: boolean) => (value ? "Sí" : "No");

      // Función para formatear las llantas, verificando si es un array
      const formatLlantas = (llantas: any[]) => {
        if (!Array.isArray(llantas)) {
          return "Datos no disponibles";
        }
        return llantas.map(llanta => `ID: ${llanta.id}, Desgaste: ${formatBoolean(llanta.desgaste)}, Observación: ${llanta.observacion || "Ninguna"}`).join("\n");
      };

      // Información General (6 columnas: B2:G2)
      await this.sheets.spreadsheets.values.update({
        auth: this.auth,
        spreadsheetId,
        range: 'Revisión de Vehículos!B2:G2',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [[sucursal, placa, conductor, tipoVehiculo, horaSalida, odometroSalida]]
        },
      });

      // Detalles de Registro (2 columnas: B4:C4)
      await this.sheets.spreadsheets.values.update({
        auth: this.auth,
        spreadsheetId,
        range: 'Revisión de Vehículos!B4:C4',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [[fechaRegistro, uniqueIdentifier]]
        },
      });

      // Revisión de Llantas (2 columnas: B6:C6)
      await this.sheets.spreadsheets.values.update({
        auth: this.auth,
        spreadsheetId,
        range: 'Revisión de Vehículos!B6:C6',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [[formatLlantas(llantasParte1), formatLlantas(llantasParte2)]]
        },
      });

      // Revisión de Fluidos (1 columna: B8)
      const formatFluidos = (fluidos: any[]) => {
        if (!Array.isArray(fluidos)) {
          return "Datos no disponibles";
        }
        return fluidos.map(fluido => `${fluido.nombre}: ${formatBoolean(fluido.requiere)} (Observación: ${fluido.observacion || "Ninguna"})`).join("\n");
      };
      await this.sheets.spreadsheets.values.update({
        auth: this.auth,
        spreadsheetId,
        range: 'Revisión de Vehículos!B8',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [[formatFluidos(fluidos)]]
        },
      });

      // Parámetros Visuales (1 columna: B10)
      const formatParametrosVisuales = (parametros: any[]) => {
        if (!Array.isArray(parametros)) {
          return "Datos no disponibles";
        }
        return parametros.map(param => `${param.nombre}: ${formatBoolean(param.si)}`).join("\n");
      };
      await this.sheets.spreadsheets.values.update({
        auth: this.auth,
        spreadsheetId,
        range: 'Revisión de Vehículos!B10',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [[formatParametrosVisuales(parametrosVisuales)]]
        },
      });

      // Revisión de Luces (1 columna: B12)
      const formatLuces = (luces: any[]) => {
        if (!Array.isArray(luces)) {
          return "Datos no disponibles";
        }
        return luces.map(luz => `${luz.nombre}: Funciona ${formatBoolean(luz.funcionaSi)}, Observación: ${luz.observacion || "Ninguna"}`).join("\n");
      };
      await this.sheets.spreadsheets.values.update({
        auth: this.auth,
        spreadsheetId,
        range: 'Revisión de Vehículos!B12',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [[formatLuces(luces)]]
        },
      });

      // Insumos (1 columna: B14)
      const formatInsumos = (insumos: any[]) => {
        if (!Array.isArray(insumos)) {
          return "Datos no disponibles";
        }
        return insumos.map(insumo => `${insumo.nombre}: ${formatBoolean(insumo.disponibleSi)}`).join("\n");
      };
      await this.sheets.spreadsheets.values.update({
        auth: this.auth,
        spreadsheetId,
        range: 'Revisión de Vehículos!B14',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [[formatInsumos(insumos)]]
        },
      });

      // Documentación (1 columna: B16)
      const formatDocumentacion = (documentacion: any[]) => {
        if (!Array.isArray(documentacion)) {
          return "Datos no disponibles";
        }
        return documentacion.map(doc => `${doc.nombre}: ${formatBoolean(doc.disponibleSi)}`).join("\n");
      };
      await this.sheets.spreadsheets.values.update({
        auth: this.auth,
        spreadsheetId,
        range: 'Revisión de Vehículos!B16',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [[formatDocumentacion(documentacion)]]
        },
      });

      // Daños en la Carrocería (1 columna: B18)
      const formatDanosCarroceria = (danos: any[]) => {
        if (!Array.isArray(danos)) {
          return "Datos no disponibles";
        }
        return danos.map(dano => `Rayones: ${formatBoolean(dano.rayones)}, Golpes: ${formatBoolean(dano.golpes)}, Observación: ${dano.observacion || "Ninguna"}`).join("\n");
      };
      await this.sheets.spreadsheets.values.update({
        auth: this.auth,
        spreadsheetId,
        range: 'Revisión de Vehículos!B18',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [[formatDanosCarroceria(danosCarroceria)]]
        },
      });

      console.log('Datos enviados correctamente a Google Sheets.');
    } catch (error) {
      console.error('Error al procesar datos o subir el archivo:', error.response?.data || error.message || error);
      throw new Error('Error al procesar datos o subir el archivo');
    }

    return { message: 'Datos procesados y almacenados correctamente en Google Sheets' };
  }


  async getPlacasFromSheet() {
    const spreadsheetId = process.env.GOOGLE_SPREADSHEETIDPLACAS;
    const range = 'Lista de Placas!C2:C';

    try {
      const response = await this.sheets.spreadsheets.values.get({
        auth: this.auth,
        spreadsheetId,
        range,
      });

      const rows = response.data.values;
      if (rows.length) {
        const placas = rows.map((row) => row[0]);
        return placas;
      } else {
        return { message: 'No hay placas disponibles en la hoja.' };
      }
    } catch (error) {
      console.error('Error al obtener las placas de Google Sheets:', error.response?.data || error.message || error);
      throw new Error('Error al obtener las placas de Google Sheets');
    }
  }


}
