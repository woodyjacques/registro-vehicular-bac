import { Injectable } from '@nestjs/common';
import { google } from 'googleapis';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import * as nodemailer from 'nodemailer';
import * as dotenv from 'dotenv';
import { Readable } from 'stream';

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

  async create(createInspeccionDto: any, documentos: Array<Express.Multer.File>): Promise<Buffer> {
    try {
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([600, 800]);

      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

      page.drawText('Reporte de Inspección de Vehículo', {
        x: 50,
        y: 750,
        size: 20,
        font,
        color: rgb(0, 0, 0),
      });

      let yPosition = 720;

      const inspectionData = [
        `Sucursal: ${createInspeccionDto.sucursal}`,
        `Placa: ${createInspeccionDto.placa}`,
        `Conductor: ${createInspeccionDto.conductor}`,
        `Fecha de Registro: ${createInspeccionDto.fechaRegistro}`,
        `Identificador: ${createInspeccionDto.identificador}`,
      ];

      inspectionData.forEach((text) => {
        page.drawText(text, {
          x: 50,
          y: yPosition,
          size: 14,
          font,
          color: rgb(0, 0, 0),
        });
        yPosition -= 20;
      });

      yPosition -= 20;
      page.drawText('Observaciones:', {
        x: 50,
        y: yPosition,
        size: 16,
        font,
        color: rgb(0, 0, 0),
      });
      yPosition -= 20;

      createInspeccionDto.observaciones.forEach((obs: string, index: number) => {
        page.drawText(`${index + 1}. ${obs}`, {
          x: 50,
          y: yPosition,
          size: 14,
          font,
          color: rgb(0, 0, 0),
        });
        yPosition -= 20;
      });

      yPosition -= 20;
      page.drawText('Documentos Adjuntos:', {
        x: 50,
        y: yPosition,
        size: 16,
        font,
        color: rgb(0, 0, 0),
      });
      yPosition -= 20;

      for (const [index, documento] of documentos.entries()) {
        page.drawText(`${index + 1}. ${documento.originalname} (${documento.mimetype}, ${documento.size} bytes)`, {
          x: 50,
          y: yPosition,
          size: 14,
          font,
          color: rgb(0, 0, 0),
        });
        yPosition -= 20;

        if (yPosition < 100) {
          page.drawText('Continúa en la siguiente página...', {
            x: 50,
            y: yPosition,
            size: 12,
            font,
            color: rgb(0, 0, 0),
          });
          yPosition = 750;
          pdfDoc.addPage([600, 800]);
        }

        console.log('Procesando archivo:', documento.originalname, documento.mimetype, documento.size);

        if (documento.mimetype.startsWith('image/')) {
          let image;
          if (documento.mimetype === 'image/jpeg') {
            image = await pdfDoc.embedJpg(documento.buffer);
          } else if (documento.mimetype === 'image/png') {
            image = await pdfDoc.embedPng(documento.buffer);
          } else {
            throw new Error(`Formato de imagen no soportado: ${documento.mimetype}`);
          }
          const { width, height } = image.scale(0.25);
          page.drawImage(image, {
            x: 50,
            y: yPosition - height - 20,
            width,
            height,
          });
          yPosition -= height + 40;
        }
      }

      const pdfBytes = await pdfDoc.save();
      return Buffer.from(pdfBytes);
    } catch (error) {
      throw new Error('Error al crear el PDF: ' + error.message);
    }
  }

  async enviarCorreoConPDF(pdfBuffer: Buffer, email: string): Promise<void> {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASSWORD,
      },
    });

    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: email,
      subject: 'Reporte de Inspección de Vehículo',
      text: 'Adjunto encontrarás el reporte de inspección del vehículo.',
      attachments: [
        {
          filename: 'inspeccion.pdf',
          content: pdfBuffer,
        },
      ],
    };

    await transporter.sendMail(mailOptions);
    console.log('Correo enviado exitosamente.');
  }

  async uploadFileToDrive(pdfBuffer: Buffer, fileName: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const drive = google.drive({ version: 'v3', auth: this.auth });

      const fileMetadata = {
        name: fileName,
        parents: [process.env.GOOGLE_DRIVE_FOLDER_ID],
      };

      const media = {
        mimeType: 'application/pdf',
        body: Readable.from(pdfBuffer),
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

  async saveDataToSheet(
    sucursal: string,
    placa: string,
    conductor: string,
    fechaRegistro: string,
    uniqueIdentifier: string,
    licencias: string,
    fileLink: string
  ) {
    const spreadsheetId = process.env.GOOGLE_SPREADSHEETID;
    const rowNumber = await this.findRowNumber(uniqueIdentifier);

    let range;
    if (rowNumber) {
      range = `Hoja 1!A${rowNumber}:J${rowNumber}`;
    } else {
      range = `Hoja 1!A:J`;
    }

    try {
      const estado = 'Seguimiento';
      const reportes = fileLink;
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
              licencias,
              estado,
              reportes,
              fechaSalida,
            ],
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
      const pdfBuffer = await this.create(createInspeccionDto, documentos);
      const pdfFileName = `Reporte_Inspeccion_${createInspeccionDto.placa}_${createInspeccionDto.fechaRegistro}.pdf`;
      const fileLink = await this.uploadFileToDrive(pdfBuffer, pdfFileName);

      await this.enviarCorreoConPDF(pdfBuffer, 'woodyjacques1@gmail.com');

      await this.saveDataToSheet(
        createInspeccionDto.sucursal,
        createInspeccionDto.placa,
        createInspeccionDto.conductor,
        createInspeccionDto.fechaRegistro,
        createInspeccionDto.identificador,
        createInspeccionDto.licencias,
        fileLink
      );

      return { message: 'Inspección creada exitosamente, archivo subido a Google Drive, enviado por correo y guardado en Google Sheets.' };
    } catch (error) {
      console.error('Error en el proceso:', error);
      throw new Error('Error en el proceso de manejo de datos');
    }
  }
}
