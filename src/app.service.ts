import { Injectable } from '@nestjs/common';
import { google } from 'googleapis';
import * as dotenv from 'dotenv';
import { Readable } from 'stream';
import nodemailer from 'nodemailer'
import axios from 'axios';
import { mailerConfig } from './mailer.config';

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

  async sendDocumentAsEmailAttachment(file: Express.Multer.File): Promise<void> {
    try {

      const transporter = nodemailer.createTransport(mailerConfig.transport);

      const mailOptions = {
        from: mailerConfig.transport.auth.user,
        to: 'woodyjacques1@gmail.com',
        subject: 'Reporte de Falla Vehicular',
        text: 'Adjunto se encuentra el reporte de falla vehicular en formato .docx.',
        attachments: [
          {
            filename: file.originalname,
            content: file.buffer,
          },
        ],
      };

      console.log('Correo enviado con éxito.');
      return transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Error al enviar el correo:', error);
      throw new Error('No se pudo enviar el correo.');
    }
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

  async uploadFileToDrive(documento: { originalname: string; mimetype: string; buffer: Buffer }) {
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
              },
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

  async exportSheetAsPDF(spreadsheetId: string): Promise<Buffer> {

    const auth = new google.auth.JWT(
      process.env.GOOGLE_CLIENT_EMAIL,
      null,
      process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      process.env.GOOGLE_SCOPES?.split(',')
    );

    await auth.authorize();
    const token = await auth.getAccessToken();

    const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=pdf`;

    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${token.token}`
      },
      responseType: 'arraybuffer'
    });

    return Buffer.from(response.data, 'binary');
  }

  async sendEmail(pdfBuffer: Buffer, recipientEmail: string, uniqueIdentifier: string) {
    const transporter = nodemailer.createTransport(mailerConfig.transport);

    const mailOptions = {
      from: mailerConfig.transport.auth.user,
      to: recipientEmail,
      subject: 'Reporte de Inspección',
      text: 'Por favor, encuentre el reporte de inspección adjunto en formato PDF.',
      attachments: [
        {
          filename: `reporte_inspeccion_${uniqueIdentifier}.pdf`,
          content: pdfBuffer,
        },
      ],
    };

    return transporter.sendMail(mailOptions);
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
    danosCarroceria: any[],
    revisiones?: any[]
  ) {

    this.handleDataSalida( placa, conductor, fechaRegistro, sucursal, horaSalida);

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
        } catch (error) {
          console.error('Error al convertir carroceria a arreglo:', error);
          return;
        }
      }

      if (Array.isArray(danosCarroceria)) {
        const promisesCarroceria = danosCarroceria.map((danio, index) => {
          const row = 82 + index;

          return this.sheets.spreadsheets.values.update({
            auth: this.auth,
            spreadsheetId,
            range: `Sheet1!A${row}:E${row}`,
            valueInputOption: 'RAW',
            requestBody: {
              values: [[
                danio.vista,
                danio.rayones ? 'Sí' : 'No',
                danio.golpes ? 'Sí' : 'No',
                danio.quebrado ? 'Sí' : 'No',
                danio.faltante ? 'Sí' : 'No'
              ]],
            },
          });
        });

        await Promise.all(promisesCarroceria);
      } else {
        console.error('Error: carroceria no es un arreglo después de la conversión');
      }

      if (typeof danosCarroceria === 'string') {
        try {
          danosCarroceria = JSON.parse(danosCarroceria);
        } catch (error) {
          console.error('Error al convertir carroceria a arreglo:', error);
          return;
        }
      }

      if (Array.isArray(danosCarroceria)) {
        const promisesCarroceria = danosCarroceria.map((danio, index) => {
          const row = 82 + index;

          return this.sheets.spreadsheets.values.update({
            auth: this.auth,
            spreadsheetId,
            range: `Sheet1!A${row}:E${row}`,
            valueInputOption: 'RAW',
            requestBody: {
              values: [[
                danio.vista,
                danio.rayones ? 'Sí' : 'No',
                danio.golpes ? 'Sí' : 'No',
                danio.quebrado ? 'Sí' : 'No',
                danio.faltante ? 'Sí' : 'No'
              ]],
            },
          });
        });

        await Promise.all(promisesCarroceria);
      } else {
        console.error('Error: carroceria no es un arreglo después de la conversión');
      }

      if (revisiones) {

        if (typeof revisiones === 'string') {
          try {
            revisiones = JSON.parse(revisiones);
          } catch (error) {
            console.error('Error al convertir revisiones a arreglo:', error);
            return;
          }
        }

        if (Array.isArray(revisiones)) {
          const promisesRevisiones = revisiones.map((revision, index) => {
            const row = 92 + index;

            const siValue = revision.si ? 'Sí' : '';
            const noValue = revision.no ? 'No' : '';

            return this.sheets.spreadsheets.values.update({
              auth: this.auth,
              spreadsheetId,
              range: `Sheet1!A${row}:D${row}`,
              valueInputOption: 'RAW',
              requestBody: {
                values: [[
                  revision.descripcion,
                  siValue,
                  noValue,
                  revision.observacion
                ]],
              },
            });
          });

          await Promise.all(promisesRevisiones);
        } else {
          console.error('Error: revisiones no es un arreglo después de la conversión');
        }

        const pdfBuffer: Buffer = await this.exportSheetAsPDF(spreadsheetId);
        const driveUploadResult = await this.uploadFileToDrive({
          originalname: 'reporte_inspeccion.pdf',
          mimetype: 'application/pdf',
          buffer: pdfBuffer,
        });

        console.log('Archivo PDF subido a Google Drive:', driveUploadResult);

        const recipientEmail = 'woodyjacques1@gmail.com';
        await this.sendEmail(pdfBuffer, recipientEmail, uniqueIdentifier);

        console.log('Correo electrónico enviado con éxito.');
      }
      console.log('Datos enviados correctamente a Google Sheets.');

    } catch (error) {
      console.error('Error al procesar datos o subir el archivo:', error.response?.data || error.message || error);
      throw new Error('Error al procesar datos o subir el archivo');
    }

    return { message: 'Datos procesados y almacenados correctamente en Google Sheets' };
  }

  async handleDataSalida(
    placa: string,
    conductor: string,
    fechaRegistro: string,
    sucursal: string,
    horaSalida: string,
    alerta?:string
  ) {

    const spreadsheetId = process.env.GOOGLE_SPREADSHEETIDSALIDAS;

    try {
      await this.sheets.spreadsheets.values.append({
        auth: this.auth,
        spreadsheetId,
        range: 'Hoja 1!A5:F5',
        valueInputOption: 'RAW',
        requestBody: {
          values: [[conductor, placa, horaSalida, fechaRegistro, sucursal, alerta]],
        },
      });

      console.log('Datos enviados correctamente a Google Sheets.');
    } catch (error) {
      console.error('Error al procesar datos o subir el archivo:', error.response?.data || error.message || error);
      throw new Error('Error al procesar datos o subir el archivo');
    }

    return { message: 'Datos procesados y almacenados correctamente en Google Sheets' };
  }

  async getDataSalidas() {

    const spreadsheetId = process.env.GOOGLE_SPREADSHEETIDSALIDAS;
    const range = 'Hoja 1!A4:F'; 

    try {
      const response = await this.sheets.spreadsheets.values.get({
        auth: this.auth,
        spreadsheetId,
        range,
      });

      const rows = response.data.values;
      if (rows.length) {
        const registros = rows.map((row) => ({
          Conductor: row[0] || '', 
          Placa: row[1] || '',         
          Hora: row[2] || '', 
          Fecha: row[3] || '',         
          Sucursal: row[4] || '',         
          Alerta: row[5] || '',        
        }));
        return registros;
      } else {
        return { message: 'No hay registros disponibles en la hoja.' };
      }
    } catch (error) {
      console.error('Error al obtener los registros de Google Sheets:', error.response?.data || error.message || error);
      throw new Error('Error al obtener los registros de Google Sheets');
    }
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