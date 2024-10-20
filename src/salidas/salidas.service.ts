import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { google } from 'googleapis';
import * as dotenv from 'dotenv';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

dotenv.config();

@Injectable()
export class SalidasService {
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
      throw new Error('Faltan las variables de entorno GOOGLE_CLIENT_EMAIL o GOOGLE_PRIVATE_KEY.');
    }

    this.auth = new google.auth.JWT(clientEmail, null, privateKey, scopes);
    console.log('Autenticación inicializada.');
  }

  private async generarPDF(datosPlaca: string[], fechaSalida: string): Promise<Buffer> {
    try {
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([600, 400]);
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const fontSize = 12;

      const title = 'Reporte de Salida de Vehículo';
      const sucursal = `Sucursal: ${datosPlaca[0]}`;
      const placa = `Placa: ${datosPlaca[1]}`;
      const conductor = `Conductor: ${datosPlaca[2]}`;
      const registro = `Registro: ${datosPlaca[3]}`;
      const identificador = `Identificador: ${datosPlaca[4]}`;
      const estado = `Estado: ${datosPlaca[6]}`;
      const fecha = `Fecha de Salida: ${fechaSalida}`;

      page.drawText(title, { x: 50, y: 350, size: 20, font, color: rgb(0, 0, 0) });
      page.drawText(sucursal, { x: 50, y: 330, size: fontSize, font });
      page.drawText(placa, { x: 50, y: 310, size: fontSize, font });
      page.drawText(conductor, { x: 50, y: 290, size: fontSize, font });
      page.drawText(registro, { x: 50, y: 270, size: fontSize, font });
      page.drawText(identificador, { x: 50, y: 250, size: fontSize, font });

      page.drawText('Licencias: Ver archivo', {
        x: 50,
        y: 230,
        size: fontSize,
        font,
        color: rgb(0, 0, 1),
      });
      page.drawText('Reportes: Ver enlace', {
        x: 50,
        y: 210,
        size: fontSize,
        font,
        color: rgb(0, 0, 1),
      });

      page.drawText(estado, { x: 50, y: 190, size: fontSize, font });
      page.drawText(fecha, { x: 50, y: 170, size: fontSize, font });

      const pdfBytes = await pdfDoc.save();
      return Buffer.from(pdfBytes); 
    } catch (error) {
      throw new Error('Error al generar el PDF.');
    }
  }

  private async enviarCorreoConPDF(pdfBuffer: Buffer, email: string): Promise<void> {
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
      subject: 'Reporte de salida del vehículo',
      text: 'Adjunto encontrarás el reporte de salida del vehículo.',
      attachments: [
        {
          filename: 'salida.pdf',
          content: pdfBuffer, 
        },
      ],
    };

    await transporter.sendMail(mailOptions);
    console.log('Correo enviado exitosamente.');
  }

  private async obtenerDatosPlaca(placa: string): Promise<string[]> {
    const spreadsheetId = process.env.GOOGLE_SPREADSHEETID;
    const range = 'Hoja 1!A:J';

    try {
      const response = await this.sheets.spreadsheets.values.get({
        auth: this.auth,
        spreadsheetId,
        range,
      });

      const rows = response.data.values;
      let datosPlaca = null;

      if (rows) {
        for (let i = 0; i < rows.length; i++) {
          if (rows[i][1] === placa) {
            datosPlaca = rows[i];
            break;
          }
        }
      }

      if (datosPlaca) {
        return datosPlaca;
      } else {
        throw new Error(`No se encontró la placa ${placa} en la hoja de cálculo.`);
      }
    } catch (error) {
      console.error('Error al obtener los datos de la placa:', error);
      throw new Error('Error al obtener los datos de la placa.');
    }
  }

  private async actualizarFechaDeSalida(placa: string, fechaSalida: string): Promise<void> {
    const spreadsheetId = process.env.GOOGLE_SPREADSHEETID;
    const range = 'Hoja 1!B:B'; 

    try {
      const response = await this.sheets.spreadsheets.values.get({
        auth: this.auth,
        spreadsheetId,
        range,
      });

      const rows = response.data.values;
      let rowNumber = null;

      const placaLimpia = placa.trim();

      if (rows) {
        for (let i = 0; i < rows.length; i++) {
          const placaEnHoja = rows[i][0]?.trim(); 
          if (placaEnHoja === placaLimpia) {
            rowNumber = i + 1; 
            break;
          }
        }
      }

      if (rowNumber) {
        const currentRange = `Hoja 1!H${rowNumber}:H${rowNumber}`;
        const currentResponse = await this.sheets.spreadsheets.values.get({
          auth: this.auth,
          spreadsheetId,
          range: currentRange,
        });
        const currentReportLink = currentResponse.data.values ? currentResponse.data.values[0][0] : '';

        const rangeToUpdate = `Hoja 1!G${rowNumber}:I${rowNumber}`; 

        await this.sheets.spreadsheets.values.update({
          auth: this.auth,
          spreadsheetId,
          range: rangeToUpdate,
          valueInputOption: 'USER_ENTERED',
          requestBody: {
            values: [['Completado', currentReportLink, fechaSalida]], 
          },
        });

        console.log(`Estado actualizado a "Completado" y fecha de salida actualizada en la fila ${rowNumber} para la placa ${placa}.`);
      } else {
        throw new Error(`No se encontró la placa ${placa} en la hoja de cálculo.`);
      }
    } catch (error) {
      console.error('Error al actualizar la fecha de salida:', error);
      throw new Error('Error al actualizar la fecha de salida.');
    }
  }

  async registrarSalida(placa: string, fechaSalida: string): Promise<any> {
    console.log(`Procesando la salida del vehículo con placa: ${placa} en la fecha ${fechaSalida}`);

    try {
      const datosPlaca = await this.obtenerDatosPlaca(placa);
      datosPlaca.push(fechaSalida);

      const pdfBuffer = await this.generarPDF(datosPlaca, fechaSalida);

      await this.enviarCorreoConPDF(pdfBuffer, 'woodyjacques1@gmail.com');

      await this.actualizarFechaDeSalida(placa, fechaSalida);

      return { message: `Salida registrada y correo enviado para el vehículo con placa ${placa}.` };
    } catch (error) {
      console.error('Error en el proceso de registrar salida:', error);
      throw new Error('Error en el proceso de registrar salida.');
    }
  }
}
