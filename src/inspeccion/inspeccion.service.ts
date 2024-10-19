import { Injectable } from '@nestjs/common';
import { google } from 'googleapis';
import * as PDFDocument from 'pdfkit';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

@Injectable()
export class InspeccionService {
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

    this.auth = new google.auth.JWT(clientEmail, null, privateKey, scopes);

    console.log("Autenticación inicializada.");
  }

  async create(createInspeccionDto: any, documentos: Array<Express.Multer.File>): Promise<string> {
    return new Promise((resolve, reject) => {
      const pdfPath = path.join(__dirname, '..', 'files', 'inspeccion.pdf');

      const dirPath = path.dirname(pdfPath);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }

      const doc = new PDFDocument();
      const writeStream = fs.createWriteStream(pdfPath);
      doc.pipe(writeStream);

      doc.fontSize(20).text('Reporte de Inspección de Vehículo', { align: 'center' });
      doc.moveDown();
      doc.fontSize(14).text(`Sucursal: ${createInspeccionDto.sucursal}`);
      doc.text(`Placa: ${createInspeccionDto.placa}`);
      doc.text(`Conductor: ${createInspeccionDto.conductor}`);
      doc.text(`Fecha de Registro: ${createInspeccionDto.fechaRegistro}`);
      doc.text(`Identificador: ${createInspeccionDto.identificador}`);

      doc.moveDown();
      doc.fontSize(16).text('Observaciones:');
      createInspeccionDto.observaciones.forEach((obs: string, index: number) => {
        doc.text(`${index + 1}. ${obs}`);
      });

      doc.moveDown();
      doc.fontSize(16).text('Documentos Adjuntos:');
      documentos.forEach((documento, index) => {
        doc.text(`${index + 1}. ${documento.originalname} (${documento.mimetype}, ${documento.size} bytes)`);

        doc.moveDown(1);

        const buffer = documento.buffer;

        doc.image(buffer, {
          fit: [250, 150],  
          align: 'center',
          valign: 'center'
        });

        doc.moveDown(2);
      });

      doc.end();

      writeStream.on('finish', () => {
        resolve(pdfPath);
      });

      writeStream.on('error', (error) => {
        reject(error);
      });
    });
  }

  async uploadFileToDrive(filePath: string, fileName: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const drive = google.drive({ version: 'v3', auth: this.auth });

      const fileMetadata = {
        name: fileName,
        parents: [process.env.GOOGLE_DRIVE_FOLDER_ID],
      };

      const media = {
        mimeType: 'application/pdf',
        body: fs.createReadStream(filePath),
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

  async findRowNumber(uniqueIdentifier: string): Promise<number | null> {
    const spreadsheetId = process.env.GOOGLE_SPREADSHEETID;
    const range = 'Hoja 1!E:E';  

    try {
      const response = await this.sheets.spreadsheets.values.get({
        auth: this.auth,
        spreadsheetId,
        range,
      });

      const rows = response.data.values;
      if (rows) {
        for (let i = 0; i < rows.length; i++) {
          if (rows[i][0] === uniqueIdentifier) {
            return i + 1;  
          }
        }
      }
      return null;
    } catch (error) {
      console.error('Error al buscar el número de fila:', error.response?.data || error.message || error);
      throw new Error('Error al buscar el número de fila');
    }
  }

  async saveDataToSheet(sucursal: string, placa: string, conductor: string, fechaRegistro: string, uniqueIdentifier: string, fileLink: string) {
    const spreadsheetId = process.env.GOOGLE_SPREADSHEETID;
    const rowNumber = await this.findRowNumber(uniqueIdentifier);  

    let range;
    if (rowNumber) {
      range = `Hoja 1!A${rowNumber}:J${rowNumber}`;  
    } else {
      range = `Hoja 1!A:J`; 
    }

    try {
      const estado = 'Inspeccionar';
      const reportes = fileLink;
      const salida = 'Registrar';
      const fechaSalida = 'No registrado';

      const response = await this.sheets.spreadsheets.values.update({
        auth: this.auth,
        spreadsheetId,
        range: range,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [
            [
              sucursal,
              placa,
              conductor,
              fechaRegistro,
              uniqueIdentifier,
              '',           
              estado,
              reportes,      
              salida,
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
  }

  async handleData(createInspeccionDto: any, documentos: Array<Express.Multer.File>) {
    try {
      // Paso 1: Generar el PDF
      const pdfPath = await this.create(createInspeccionDto, documentos);
      const pdfFileName = `Reporte_Inspeccion_${createInspeccionDto.placa}_${createInspeccionDto.fechaRegistro}.pdf`;
      const fileLink = await this.uploadFileToDrive(pdfPath, pdfFileName);

      await this.saveDataToSheet(
        createInspeccionDto.sucursal,
        createInspeccionDto.placa,
        createInspeccionDto.conductor,
        createInspeccionDto.fechaRegistro,
        createInspeccionDto.identificador,
        fileLink
      );

      fs.unlinkSync(pdfPath);

      return { message: 'Inspección creada exitosamente, archivo subido a Google Drive y enlace guardado en Google Sheets.' };
    } catch (error) {
      console.error('Error en el proceso:', error);
      throw new Error('Error en el proceso de manejo de datos');
    }
  }
}
