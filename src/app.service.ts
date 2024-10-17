import { Injectable } from '@nestjs/common';
import { google } from 'googleapis';

@Injectable()
export class AppService {
  private sheets = google.sheets('v4');
  private auth: any;

  // constructor() {
  //   this.initializeAuth();
  // }

  // private initializeAuth() {
  //   this.auth = new google.auth.JWT(
  //     process.env.GOOGLE_CLIENT_EMAIL,
  //     null,
  //     (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
  //     ['https://www.googleapis.com/auth/spreadsheets']
  //   );
  // }

  async handleData(placa: string, conductor: string, sucursal: string, documento?: Express.Multer.File) {

    // console.log(process.env.GOOGLE_CLIENT_EMAIL);
    // const spreadsheetId = '1FH3KggUBpLr6VrF5GOVBcXEpQ8muf9a9TMZgD3vuXO4';

    // try {
    //   const response = await this.sheets.spreadsheets.values.append({
    //     auth: this.auth,
    //     spreadsheetId,
    //     range: 'Sheet1!A:C',
    //     valueInputOption: 'USER_ENTERED',
    //     requestBody: {
    //       values: [[sucursal, placa, conductor]],
    //     },
    //   });

    //   console.log('Datos enviados a Google Sheets:', response.data);
    // } catch (error) {
    //   console.error('Error al enviar datos a Google Sheets:', error.response?.data || error.message || error);
    //   throw new Error('Error al enviar datos a Google Sheets');
    // }

    // return { message: 'Datos procesados y enviados a Google Sheets' };
  }
}
