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

  async handleData(
    placa: string,
    conductor: string,
    sucursal: string,
    tipoVehiculo: string,
    horaSalida: string,
    odometroSalida: string,
    fechaRegistro: string,
    uniqueIdentifier: string,
    llantasParte1: any[],
    llantasParte2: any[],
    fluidos: any[],
    parametrosVisuales: any[],
    luces: any[],
    insumos: any[],
    documentacion: any[],
    danosCarroceria: any[]
  ) {
    const spreadsheetId = process.env.GOOGLE_SPREADSHEETID;

    try {
      await this.sheets.spreadsheets.values.update({
        auth: this.auth,
        spreadsheetId,
        range: 'Sheet1!B5',
        valueInputOption: 'RAW',
        requestBody: {
          values: [[sucursal]],
        },
      });

      await this.sheets.spreadsheets.values.update({
        auth: this.auth,
        spreadsheetId,
        range: 'Sheet1!B6',
        valueInputOption: 'RAW',
        requestBody: {
          values: [[conductor]],
        },
      });

      await this.sheets.spreadsheets.values.update({
        auth: this.auth,
        spreadsheetId,
        range: 'Sheet1!B7',
        valueInputOption: 'RAW',
        requestBody: {
          values: [[fechaRegistro]],
        },
      });

      await this.sheets.spreadsheets.values.update({
        auth: this.auth,
        spreadsheetId,
        range: 'Sheet1!B8',
        valueInputOption: 'RAW',
        requestBody: {
          values: [[horaSalida]],
        },
      });

      await this.sheets.spreadsheets.values.update({
        auth: this.auth,
        spreadsheetId,
        range: 'Sheet1!B9',
        valueInputOption: 'RAW',
        requestBody: {
          values: [[odometroSalida]],
        },
      });

      await this.sheets.spreadsheets.values.update({
        auth: this.auth,
        spreadsheetId,
        range: 'Sheet1!B10',
        valueInputOption: 'RAW',
        requestBody: {
          values: [[placa]],
        },
      });

      await this.sheets.spreadsheets.values.update({
        auth: this.auth,
        spreadsheetId,
        range: 'Sheet1!B11',
        valueInputOption: 'RAW',
        requestBody: {
          values: [[tipoVehiculo]],
        },
      });

      if (typeof llantasParte1 === 'string') {
        try {
          llantasParte1 = JSON.parse(llantasParte1);
          console.log('llantasParte1 convertido a arreglo:', llantasParte1);
        } catch (error) {
          console.error('Error al convertir llantasParte1 a arreglo:', error);
          return;
        }
      }

      if (Array.isArray(llantasParte1)) {
        const promisesParte1 = llantasParte1.map((llanta, index) => {
          const row = 16 + index;

          return this.sheets.spreadsheets.values.update({
            auth: this.auth,
            spreadsheetId,
            range: `Sheet1!B${row}:F${row}`,
            valueInputOption: 'RAW',
            requestBody: {
              values: [[
                llanta.fp ? 'Sí' : 'No',
                llanta.pe ? 'Sí' : 'No',
                llanta.pa ? 'Sí' : 'No',
                llanta.desgaste ? 'Sí' : 'No',
                llanta.observacion || '',
              ]],
            },
          });
        });

        await Promise.all(promisesParte1);
      } else {
        console.error('Error: llantasParte1 no es un arreglo después de la conversión');
      }

      if (typeof llantasParte2 === 'string') {
        try {
          llantasParte2 = JSON.parse(llantasParte2);
          console.log('llantasParte2 convertido a arreglo:', llantasParte2);
        } catch (error) {
          console.error('Error al convertir llantasParte2 a arreglo:', error);
          return;
        }
      }

      if (Array.isArray(llantasParte2)) {
        const promisesParte2 = llantasParte2.map((llanta, index) => {
          const row = 21 + index;

          return this.sheets.spreadsheets.values.update({
            auth: this.auth,
            spreadsheetId,
            range: `Sheet1!B${row}:F${row}`,
            valueInputOption: 'RAW',
            requestBody: {
              values: [[
                llanta.fp ? 'Sí' : 'No',
                llanta.pe ? 'Sí' : 'No',
                llanta.pa ? 'Sí' : 'No',
                llanta.desgaste ? 'Sí' : 'No',
                llanta.observacion || '',
              ]],
            },
          });
        });
        await Promise.all(promisesParte2);
      } else {
        console.error('Error: llantasParte2 no es un arreglo después de la conversión');
      }

      if (typeof fluidos === 'string') {
        try {
          fluidos = JSON.parse(fluidos);
          console.log('fluidos convertido a arreglo:', fluidos);
        } catch (error) {
          console.error('Error al convertir fluidos a arreglo:', error);
          return;
        }
      }

      if (Array.isArray(fluidos)) {
        const promisesFluidos = fluidos.map((fluido, index) => {
          const row = 30 + index;

          return this.sheets.spreadsheets.values.update({
            auth: this.auth,
            spreadsheetId,
            range: `Sheet1!A${row}:D${row}`,
            valueInputOption: 'RAW',
            requestBody: {
              values: [[
                fluido.nombre,
                fluido.requiere ? 'Sí' : 'No',
                fluido.lleno ? 'Sí' : 'No',
                fluido.observacion || '',
              ]],
            },
          });
        });

        await Promise.all(promisesFluidos);
      } else {
        console.error('Error: fluidos no es un arreglo después de la conversión');
      }

      if (typeof parametrosVisuales === 'string') {
        try {
          parametrosVisuales = JSON.parse(parametrosVisuales);
          console.log('parametrosVisuales convertido a arreglo:', parametrosVisuales);
        } catch (error) {
          console.error('Error al convertir parametrosVisuales a arreglo:', error);
          return;
        }
      }

      if (Array.isArray(parametrosVisuales)) {
        const promisesParametros = parametrosVisuales.map((parametro, index) => {
          const row = 38 + index;

          return this.sheets.spreadsheets.values.update({
            auth: this.auth,
            spreadsheetId,
            range: `Sheet1!A${row}:D${row}`,
            valueInputOption: 'RAW',
            requestBody: {
              values: [[
                parametro.nombre,
                parametro.si ? 'Sí' : 'No',
                parametro.no ? 'Sí' : 'No',
                parametro.observacion || '',
              ]],
            },
          });
        });

        await Promise.all(promisesParametros);
      } else {
        console.error('Error: parametrosVisuales no es un arreglo después de la conversión');
      }

      if (typeof luces === 'string') {
        try {
          luces = JSON.parse(luces);
          console.log('luces convertido a arreglo:', luces);
        } catch (error) {
          console.error('Error al convertir luces a arreglo:', error);
          return;
        }
      }

      if (Array.isArray(luces)) {
        const promisesLuces = luces.map((luz, index) => {
          const row = 46 + index;

          return this.sheets.spreadsheets.values.update({
            auth: this.auth,
            spreadsheetId,
            range: `Sheet1!A${row}:D${row}`,
            valueInputOption: 'RAW',
            requestBody: {
              values: [[
                luz.nombre,
                luz.funcionaSi ? 'Sí' : 'No',
                luz.funcionaNo ? 'Sí' : 'No',
                luz.observacion || '',
              ]],
            },
          });
        });

        await Promise.all(promisesLuces);
      } else {
        console.error('Error: luces no es un arreglo después de la conversión');
      }

      if (typeof insumos === 'string') {
        try {
          insumos = JSON.parse(insumos);
          console.log('insumos convertido a arreglo:', insumos);
        } catch (error) {
          console.error('Error al convertir insumos a arreglo:', error);
          return;
        }
      }

      if (Array.isArray(insumos)) {
        const promisesInsumos = insumos.map((insumo, index) => {
          const row = 58 + index;

          return this.sheets.spreadsheets.values.update({
            auth: this.auth,
            spreadsheetId,
            range: `Sheet1!A${row}:C${row}`,
            valueInputOption: 'RAW',
            requestBody: {
              values: [[
                insumo.nombre,
                insumo.disponibleSi ? 'Sí' : 'No',
                insumo.disponibleNo ? 'Sí' : 'No',
              ]],
            },
          });
        });

        await Promise.all(promisesInsumos);
      } else {
        console.error('Error: insumos no es un arreglo después de la conversión');
      }

      if (typeof documentacion === 'string') {
        try {
          documentacion = JSON.parse(documentacion);
          console.log('documentacion convertido a arreglo:', documentacion);
        } catch (error) {
          console.error('Error al convertir documentacion a arreglo:', error);
          return;
        }
      }

      if (Array.isArray(documentacion)) {
        const promisesDocumentacion = documentacion.map((doc, index) => {
          const row = 70 + index;
          return this.sheets.spreadsheets.values.update({
            auth: this.auth,
            spreadsheetId,
            range: `Sheet1!A${row}:C${row}`,
            valueInputOption: 'RAW',
            requestBody: {
              values: [[
                doc.nombre,
                doc.disponibleSi ? 'Sí' : 'No',
                doc.disponibleNo ? 'Sí' : 'No',
              ]],
            },
          });
        });

        await Promise.all(promisesDocumentacion);
      } else {
        console.error('Error: documentacion no es un arreglo después de la conversión');
      }

      if (typeof danosCarroceria === 'string') {
        try {
          danosCarroceria = JSON.parse(danosCarroceria);
          console.log('carroceria convertido a arreglo:', danosCarroceria);
        } catch (error) {
          console.error('Error al convertir carroceria a arreglo:', error);
          return;
        }
      }

      if (Array.isArray(danosCarroceria)) {
        const promisesCarroceria = danosCarroceria.map((danio, index) => {
          const row = 82 + index; // Comienza en la fila 82 para Daños de carrocería

          return this.sheets.spreadsheets.values.update({
            auth: this.auth,
            spreadsheetId,
            range: `Sheet1!A${row}:E${row}`,
            valueInputOption: 'RAW',
            requestBody: {
              values: [[
                danio.vista,                           // Columna A - Nombre de la vista
                danio.rayones ? 'Sí' : 'No',            // Columna B - Rayones
                danio.golpes ? 'Sí' : 'No',             // Columna C - Golpes
                danio.quebrado ? 'Sí' : 'No',           // Columna D - Quebrado
                danio.faltante ? 'Sí' : 'No'            // Columna E - Faltante
              ]],
            },
          });
        });

        await Promise.all(promisesCarroceria);
      } else {
        console.error('Error: carroceria no es un arreglo después de la conversión');
      }


      console.log('Datos enviados correctamente a Google Sheets.');
    } catch (error) {
      console.error('Error al procesar datos o subir el archivo:', error.response?.data || error.message || error);
      throw new Error('Error al procesar datos o subir el archivo');
    }

    return { message: 'Datos procesados y almacenados correctamente en Google Sheets' };
  }




}


// const response = await this.sheets.spreadsheets.get({
//   auth: this.auth,
//   spreadsheetId,
// });

// const spreadsheetTitle = response.data.properties?.title;
// const sheetsInfo = response.data.sheets?.map(sheet => ({
//   title: sheet.properties?.title,
//   id: sheet.properties?.sheetId,
// }));

// console.log('Spreadsheet title:', spreadsheetTitle);
// console.log('Sheet information:', sheetsInfo);