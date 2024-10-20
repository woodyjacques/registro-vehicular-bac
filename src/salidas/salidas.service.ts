import { Injectable } from '@nestjs/common';
import * as PDFDocument from 'pdfkit';
import * as fs from 'fs';
import * as path from 'path';
import * as nodemailer from 'nodemailer';
import { google } from 'googleapis';
import * as dotenv from 'dotenv';

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

  private async generarPDF(datosPlaca: string[], fechaSalida: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const pdfDir = path.join(__dirname, '..', 'files'); 
      const pdfPath = path.join(pdfDir, `salida_${datosPlaca[1]}.pdf`);

      if (!fs.existsSync(pdfDir)) {
        fs.mkdirSync(pdfDir, { recursive: true });
      }

      const doc = new PDFDocument();
      const writeStream = fs.createWriteStream(pdfPath);
      doc.pipe(writeStream);

      doc.fontSize(20).text('Reporte de Salida de Vehículo', { align: 'center' });
      doc.moveDown();
      doc.fontSize(14).text(`Sucursal: ${datosPlaca[0]}`);
      doc.text(`Placa: ${datosPlaca[1]}`);
      doc.text(`Conductor: ${datosPlaca[2]}`);
      doc.text(`Registro: ${datosPlaca[3]}`);
      doc.text(`Identificador: ${datosPlaca[4]}`);

      doc.fontSize(14).fillColor('blue').text('Licencias: Ver archivo', {
        link: datosPlaca[5],
        underline: true
      });

      doc.fontSize(14).fillColor('blue').text('Reportes: Ver enlace', {
        link: datosPlaca[7],
        underline: true
      });

      doc.fillColor('black').fontSize(14).text(`Estado: ${datosPlaca[6]}`);
      doc.text(`Fecha de Salida: ${fechaSalida}`);

      doc.end();

      writeStream.on('finish', () => {
        resolve(pdfPath);
      });

      writeStream.on('error', (error) => {
        reject(error);
      });
    });
  }

  private async enviarCorreoConPDF(pdfPath: string, email: string): Promise<void> {
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
          filename: path.basename(pdfPath),
          path: pdfPath,
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

      const pdfPath = await this.generarPDF(datosPlaca, fechaSalida);

      await this.enviarCorreoConPDF(pdfPath, 'woodyjacques1@gmail.com');

      await this.actualizarFechaDeSalida(placa, fechaSalida);

      fs.unlinkSync(pdfPath);

      return { message: `Salida registrada y correo enviado para el vehículo con placa ${placa}.` };
    } catch (error) {
      console.error('Error en el proceso de registrar salida:', error);
      throw new Error('Error en el proceso de registrar salida.');
    }
  }
}
