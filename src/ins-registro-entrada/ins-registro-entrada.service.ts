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

      const columnGRange = `Hoja 1!G${rowNumber}:G${rowNumber}`;
      await this.sheets.spreadsheets.values.update({
        auth: this.auth,
        spreadsheetId,
        range: columnGRange,
        valueInputOption: 'RAW',
        requestBody: {
          values: [['entrada']],
        },
      });

      const HoraEntrada = new Date().toLocaleString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });

      const columnGRange2 = `Hoja 1!GG${rowNumber}:GG${rowNumber}`;
      await this.sheets.spreadsheets.values.update({
        auth: this.auth,
        spreadsheetId,
        range: columnGRange2,
        valueInputOption: 'RAW',
        requestBody: {
          values: [[HoraEntrada]],
        },
      });

      console.log('Datos enviados correctamente a Google Sheets.');

      const rowData = await this.getRowFromSheet(rowNumber);

      return {
        message: 'Datos procesados y almacenados correctamente en Google Sheets',
        updatedRow: rowData,
      };
    } catch (error) {
      console.error('Error al procesar datos o subir el archivo:', error.response?.data || error.message || error);
      throw new Error('Error al procesar datos o subir el archivo');
    }
  }

  async getRowFromSheet(rowNumber: number) {

    const spreadsheetId = process.env.GOOGLE_INSPECCIONSALIDAS;
    const sheetName = 'Hoja 1';
    const range = `${sheetName}!A${rowNumber}:GG${rowNumber}`;
    const spreadsheetrev3 = process.env.GOOGLE_R06PT19REVISIONDEVEHICULOSrev3;

    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId,
        range,
      });

      const row = response.data.values;
      console.log(JSON.stringify(row, null, 2));

      // Datos principales
      const fecha = row[0][0];
      const placa = row[0][1];
      const nombreConductor = row[0][2];
      const sucursal = row[0][3];
      const tipoVehiculo = row[0][4];
      const odometro = row[0][5];
      const horas = row[0].slice(-2);
      const HoraSalida = horas[0];
      const HoraEntrada = horas[1];

      // hora salida
      await this.sheets.spreadsheets.values.update({
        auth: this.auth,
        spreadsheetId: spreadsheetrev3,
        range: 'Hoja1!C11',
        valueInputOption: 'RAW',
        requestBody: {
          values: [[HoraSalida]],
        },
      });

      // hora entrada
      await this.sheets.spreadsheets.values.update({
        auth: this.auth,
        spreadsheetId: spreadsheetrev3,
        range: 'Hoja1!H11',
        valueInputOption: 'RAW',
        requestBody: {
          values: [[HoraEntrada]],
        },
      });

      // fecha
      await this.sheets.spreadsheets.values.update({
        auth: this.auth,
        spreadsheetId: spreadsheetrev3,
        range: 'Hoja1!C10',
        valueInputOption: 'RAW',
        requestBody: {
          values: [[fecha]],
        },
      });

      // placa
      await this.sheets.spreadsheets.values.update({
        auth: this.auth,
        spreadsheetId: spreadsheetrev3,
        range: 'Hoja1!I9',
        valueInputOption: 'RAW',
        requestBody: {
          values: [[placa]],
        },
      });

      // nombre
      await this.sheets.spreadsheets.values.update({
        auth: this.auth,
        spreadsheetId: spreadsheetrev3,
        range: 'Hoja1!D9',
        valueInputOption: 'RAW',
        requestBody: {
          values: [[nombreConductor]],
        },
      });

      // sucursal
      await this.sheets.spreadsheets.values.update({
        auth: this.auth,
        spreadsheetId: spreadsheetrev3,
        range: 'Hoja1!C4',
        valueInputOption: 'RAW',
        requestBody: {
          values: [[sucursal]],
        },
      });

      // tipo de vehiculo
      await this.sheets.spreadsheets.values.update({
        auth: this.auth,
        spreadsheetId: spreadsheetrev3,
        range: 'Hoja1!H10',
        valueInputOption: 'RAW',
        requestBody: {
          values: [[tipoVehiculo]],
        },
      });

      // odometro
      await this.sheets.spreadsheets.values.update({
        auth: this.auth,
        spreadsheetId: spreadsheetrev3,
        range: 'Hoja1!D12',
        valueInputOption: 'RAW',
        requestBody: {
          values: [[odometro]],
        },
      });

      const llanta1Obs1 = row[0][8];
      const llanta1Obs2 = row[0][9];
      const llanta1Obs3 = row[0][10];
      const llanta1Obs4 = row[0][11];

      await this.sheets.spreadsheets.values.update({
        auth: this.auth,
        spreadsheetId: spreadsheetrev3,
        range: 'Hoja1!C18', 
        valueInputOption: 'RAW',
        requestBody: {
          values: [[llanta1Obs1]], 
        },
      });

      await this.sheets.spreadsheets.values.update({
        auth: this.auth,
        spreadsheetId: spreadsheetrev3,
        range: 'Hoja1!D18',
        valueInputOption: 'RAW',
        requestBody: {
          values: [[llanta1Obs2]], 
        },
      });

      await this.sheets.spreadsheets.values.update({
        auth: this.auth,
        spreadsheetId: spreadsheetrev3,
        range: 'Hoja1!E18', 
        valueInputOption: 'RAW',
        requestBody: {
          values: [[llanta1Obs3]], 
        },
      });

      await this.sheets.spreadsheets.values.update({
        auth: this.auth,
        spreadsheetId: spreadsheetrev3,
        range: 'Hoja1!F18', 
        valueInputOption: 'RAW',
        requestBody: {
          values: [[llanta1Obs4]], 
        },
      });

      const llanta2Obs1 = row[0][13];
      const llanta2Obs2 = row[0][14];
      const llanta2Obs3 = row[0][15];
      const llanta2Obs4 = row[0][16];

      await this.sheets.spreadsheets.values.update({
        auth: this.auth,
        spreadsheetId: spreadsheetrev3,
        range: 'Hoja1!C19', 
        valueInputOption: 'RAW',
        requestBody: {
          values: [[llanta2Obs1]], 
        },
      });

      await this.sheets.spreadsheets.values.update({
        auth: this.auth,
        spreadsheetId: spreadsheetrev3,
        range: 'Hoja1!D19', 
        valueInputOption: 'RAW',
        requestBody: {
          values: [[llanta2Obs2]], 
        },
      });

      await this.sheets.spreadsheets.values.update({
        auth: this.auth,
        spreadsheetId: spreadsheetrev3,
        range: 'Hoja1!E19', 
        valueInputOption: 'RAW',
        requestBody: {
          values: [[llanta2Obs3]], 
        },
      });

      await this.sheets.spreadsheets.values.update({
        auth: this.auth,
        spreadsheetId: spreadsheetrev3,
        range: 'Hoja1!F19', 
        valueInputOption: 'RAW',
        requestBody: {
          values: [[llanta2Obs4]], 
        },
      });

      const llanta3Obs1 = row[0][18];
      const llanta3Obs2 = row[0][19];
      const llanta3Obs3 = row[0][20];
      const llanta3Obs4 = row[0][21];

      await this.sheets.spreadsheets.values.update({
        auth: this.auth,
        spreadsheetId: spreadsheetrev3,
        range: 'Hoja1!C20', 
        valueInputOption: 'RAW',
        requestBody: {
          values: [[llanta3Obs1]], 
        },
      });

      await this.sheets.spreadsheets.values.update({
        auth: this.auth,
        spreadsheetId: spreadsheetrev3,
        range: 'Hoja1!D20', 
        valueInputOption: 'RAW',
        requestBody: {
          values: [[llanta3Obs2]], 
        },
      });

      await this.sheets.spreadsheets.values.update({
        auth: this.auth,
        spreadsheetId: spreadsheetrev3,
        range: 'Hoja1!E20', 
        valueInputOption: 'RAW',
        requestBody: {
          values: [[llanta3Obs3]], 
        },
      });

      await this.sheets.spreadsheets.values.update({
        auth: this.auth,
        spreadsheetId: spreadsheetrev3,
        range: 'Hoja1!F20', 
        valueInputOption: 'RAW',
        requestBody: {
          values: [[llanta3Obs4]], 
        },
      });

      const llanta4Obs1 = row[0][23];
      const llanta4Obs2 = row[0][24];
      const llanta4Obs3 = row[0][25];
      const llanta4Obs4 = row[0][26];

      await this.sheets.spreadsheets.values.update({
        auth: this.auth,
        spreadsheetId: spreadsheetrev3,
        range: 'Hoja1!C21', 
        valueInputOption: 'RAW',
        requestBody: {
          values: [[llanta4Obs1]], 
        },
      });

      await this.sheets.spreadsheets.values.update({
        auth: this.auth,
        spreadsheetId: spreadsheetrev3,
        range: 'Hoja1!D21', 
        valueInputOption: 'RAW',
        requestBody: {
          values: [[llanta4Obs2]], 
        },
      });

      await this.sheets.spreadsheets.values.update({
        auth: this.auth,
        spreadsheetId: spreadsheetrev3,
        range: 'Hoja1!E21', 
        valueInputOption: 'RAW',
        requestBody: {
          values: [[llanta4Obs3]], 
        },
      });

      await this.sheets.spreadsheets.values.update({
        auth: this.auth,
        spreadsheetId: spreadsheetrev3,
        range: 'Hoja1!F21', 
        valueInputOption: 'RAW',
        requestBody: {
          values: [[llanta4Obs4]], 
        },
      });

      const llanta5Obs1 = row[0][28];
      const llanta5Obs2 = row[0][29];
      const llanta5Obs3 = row[0][30];
      const llanta5Obs4 = row[0][31];

      await this.sheets.spreadsheets.values.update({
        auth: this.auth,
        spreadsheetId: spreadsheetrev3,
        range: 'Hoja1!C22', 
        valueInputOption: 'RAW',
        requestBody: {
          values: [[llanta5Obs1]], 
        },
      });

      await this.sheets.spreadsheets.values.update({
        auth: this.auth,
        spreadsheetId: spreadsheetrev3,
        range: 'Hoja1!D22', 
        valueInputOption: 'RAW',
        requestBody: {
          values: [[llanta5Obs2]], 
        },
      });

      await this.sheets.spreadsheets.values.update({
        auth: this.auth,
        spreadsheetId: spreadsheetrev3,
        range: 'Hoja1!E22', 
        valueInputOption: 'RAW',
        requestBody: {
          values: [[llanta5Obs3]], 
        },
      });

      await this.sheets.spreadsheets.values.update({
        auth: this.auth,
        spreadsheetId: spreadsheetrev3,
        range: 'Hoja1!F22', 
        valueInputOption: 'RAW',
        requestBody: {
          values: [[llanta5Obs4]], 
        },
      });

      const llanta6Obs1 = row[0][33];
      const llanta6Obs2 = row[0][34];
      const llanta6Obs3 = row[0][35];
      const llanta6Obs4 = row[0][36];
 
      await this.sheets.spreadsheets.values.update({
        auth: this.auth,
        spreadsheetId: spreadsheetrev3,
        range: 'Hoja1!C23', 
        valueInputOption: 'RAW',
        requestBody: {
          values: [[llanta6Obs1]], 
        },
      });

      await this.sheets.spreadsheets.values.update({
        auth: this.auth,
        spreadsheetId: spreadsheetrev3,
        range: 'Hoja1!D23', 
        valueInputOption: 'RAW',
        requestBody: {
          values: [[llanta6Obs2]], 
        },
      });

      await this.sheets.spreadsheets.values.update({
        auth: this.auth,
        spreadsheetId: spreadsheetrev3,
        range: 'Hoja1!E23', 
        valueInputOption: 'RAW',
        requestBody: {
          values: [[llanta6Obs3]], 
        },
      });

      await this.sheets.spreadsheets.values.update({
        auth: this.auth,
        spreadsheetId: spreadsheetrev3,
        range: 'Hoja1!F23', 
        valueInputOption: 'RAW',
        requestBody: {
          values: [[llanta6Obs4]], 
        },
      });

      const llanta7Obs1 = row[0][38];
      const llanta7Obs2 = row[0][39];
      const llanta7Obs3 = row[0][40];
      const llanta7Obs4 = row[0][41];

      await this.sheets.spreadsheets.values.update({
        auth: this.auth,
        spreadsheetId: spreadsheetrev3,
        range: 'Hoja1!C24', 
        valueInputOption: 'RAW',
        requestBody: {
          values: [[llanta7Obs1]], 
        },
      });

      await this.sheets.spreadsheets.values.update({
        auth: this.auth,
        spreadsheetId: spreadsheetrev3,
        range: 'Hoja1!D24', 
        valueInputOption: 'RAW',
        requestBody: {
          values: [[llanta7Obs2]], 
        },
      });

      await this.sheets.spreadsheets.values.update({
        auth: this.auth,
        spreadsheetId: spreadsheetrev3,
        range: 'Hoja1!E24', 
        valueInputOption: 'RAW',
        requestBody: {
          values: [[llanta7Obs3]], 
        },
      });

      await this.sheets.spreadsheets.values.update({
        auth: this.auth,
        spreadsheetId: spreadsheetrev3,
        range: 'Hoja1!F24', 
        valueInputOption: 'RAW',
        requestBody: {
          values: [[llanta7Obs4]], 
        },
      });

      const llanta8Obs1 = row[0][43];
      const llanta8Obs2 = row[0][44];
      const llanta8Obs3 = row[0][45];
      const llanta8Obs4 = row[0][46];

      await this.sheets.spreadsheets.values.update({
        auth: this.auth,
        spreadsheetId: spreadsheetrev3,
        range: 'Hoja1!C25', 
        valueInputOption: 'RAW',
        requestBody: {
          values: [[llanta8Obs1]], 
        },
      });

      await this.sheets.spreadsheets.values.update({
        auth: this.auth,
        spreadsheetId: spreadsheetrev3,
        range: 'Hoja1!D25', 
        valueInputOption: 'RAW',
        requestBody: {
          values: [[llanta8Obs2]], 
        },
      });

      await this.sheets.spreadsheets.values.update({
        auth: this.auth,
        spreadsheetId: spreadsheetrev3,
        range: 'Hoja1!E25', 
        valueInputOption: 'RAW',
        requestBody: {
          values: [[llanta8Obs3]], 
        },
      });

      await this.sheets.spreadsheets.values.update({
        auth: this.auth,
        spreadsheetId: spreadsheetrev3,
        range: 'Hoja1!F25', 
        valueInputOption: 'RAW',
        requestBody: {
          values: [[llanta8Obs4]], 
        },
      });

      const llanta9Obs1 = row[0][48];
      const llanta9Obs2 = row[0][49];
      const llanta9Obs3 = row[0][50];
      const llanta9Obs4 = row[0][51];

      await this.sheets.spreadsheets.values.update({
        auth: this.auth,
        spreadsheetId: spreadsheetrev3,
        range: 'Hoja1!C26', 
        valueInputOption: 'RAW',
        requestBody: {
          values: [[llanta9Obs1]], 
        },
      });

      await this.sheets.spreadsheets.values.update({
        auth: this.auth,
        spreadsheetId: spreadsheetrev3,
        range: 'Hoja1!D26', 
        valueInputOption: 'RAW',
        requestBody: {
          values: [[llanta9Obs2]], 
        },
      });

      await this.sheets.spreadsheets.values.update({
        auth: this.auth,
        spreadsheetId: spreadsheetrev3,
        range: 'Hoja1!E26', 
        valueInputOption: 'RAW',
        requestBody: {
          values: [[llanta9Obs3]], 
        },
      });

      await this.sheets.spreadsheets.values.update({
        auth: this.auth,
        spreadsheetId: spreadsheetrev3,
        range: 'Hoja1!F26', 
        valueInputOption: 'RAW',
        requestBody: {
          values: [[llanta9Obs4]], 
        },
      });

      const llanta10Obs1 = row[0][53];
      const llanta10Obs2 = row[0][54];
      const llanta10Obs3 = row[0][55];
      const llanta10Obs4 = row[0][56];
      
      await this.sheets.spreadsheets.values.update({
        auth: this.auth,
        spreadsheetId: spreadsheetrev3,
        range: 'Hoja1!C27', 
        valueInputOption: 'RAW',
        requestBody: {
          values: [[llanta10Obs1]], 
        },
      });

      await this.sheets.spreadsheets.values.update({
        auth: this.auth,
        spreadsheetId: spreadsheetrev3,
        range: 'Hoja1!D27', 
        valueInputOption: 'RAW',
        requestBody: {
          values: [[llanta10Obs2]], 
        },
      });

      await this.sheets.spreadsheets.values.update({
        auth: this.auth,
        spreadsheetId: spreadsheetrev3,
        range: 'Hoja1!E27', 
        valueInputOption: 'RAW',
        requestBody: {
          values: [[llanta10Obs3]], 
        },
      });

      await this.sheets.spreadsheets.values.update({
        auth: this.auth,
        spreadsheetId: spreadsheetrev3,
        range: 'Hoja1!F27', 
        valueInputOption: 'RAW',
        requestBody: {
          values: [[llanta10Obs4]], 
        },
      });

      const observacionesLlantas = row[0][57];

      await this.sheets.spreadsheets.values.update({
        auth: this.auth,
        spreadsheetId: spreadsheetrev3,
        range: 'Hoja1!C30', 
        valueInputOption: 'RAW',
        requestBody: {
          values: [[observacionesLlantas]], 
        },
      });

      const nivel1Obs1 = row[0][60];
      const nivel1Obs2 = row[0][61];

      await this.sheets.spreadsheets.values.update({
        auth: this.auth,
        spreadsheetId: spreadsheetrev3,
        range: 'Hoja1!G33', 
        valueInputOption: 'RAW',
        requestBody: {
          values: [[ nivel1Obs1 ]], 
        },
      });

      await this.sheets.spreadsheets.values.update({
        auth: this.auth,
        spreadsheetId: spreadsheetrev3,
        range: 'Hoja1!H33', 
        valueInputOption: 'RAW',
        requestBody: {
          values: [[ nivel1Obs2 ]], 
        },
      });

      const nivel2Obs1 = row[0][64];
      const nivel2Obs2 = row[0][65];

      await this.sheets.spreadsheets.values.update({
        auth: this.auth,
        spreadsheetId: spreadsheetrev3,
        range: 'Hoja1!G34', 
        valueInputOption: 'RAW',
        requestBody: {
          values: [[ nivel2Obs1 ]], 
        },
      });

      await this.sheets.spreadsheets.values.update({
        auth: this.auth,
        spreadsheetId: spreadsheetrev3,
        range: 'Hoja1!H34', 
        valueInputOption: 'RAW',
        requestBody: {
          values: [[ nivel2Obs2 ]], 
        },
      });

      const nivel3Obs1 = row[0][68];
      const nivel3Obs2 = row[0][69];

      await this.sheets.spreadsheets.values.update({
        auth: this.auth,
        spreadsheetId: spreadsheetrev3,
        range: 'Hoja1!G35', 
        valueInputOption: 'RAW',
        requestBody: {
          values: [[ nivel3Obs1 ]], 
        },
      });

      await this.sheets.spreadsheets.values.update({
        auth: this.auth,
        spreadsheetId: spreadsheetrev3,
        range: 'Hoja1!H35', 
        valueInputOption: 'RAW',
        requestBody: {
          values: [[ nivel3Obs2 ]], 
        },
      });

      const nivel4Obs1 = row[0][72];
      const nivel4Obs2 = row[0][73];

      await this.sheets.spreadsheets.values.update({
        auth: this.auth,
        spreadsheetId: spreadsheetrev3,
        range: 'Hoja1!G36', 
        valueInputOption: 'RAW',
        requestBody: {
          values: [[ nivel4Obs1 ]], 
        },
      });

      await this.sheets.spreadsheets.values.update({
        auth: this.auth,
        spreadsheetId: spreadsheetrev3,
        range: 'Hoja1!H36', 
        valueInputOption: 'RAW',
        requestBody: {
          values: [[ nivel4Obs2 ]], 
        },
      });

      const observacionesFluidos = row[0][74];

      await this.sheets.spreadsheets.values.update({
        auth: this.auth,
        spreadsheetId: spreadsheetrev3,
        range: 'Hoja1!H37', 
        valueInputOption: 'RAW',
        requestBody: {
          values: [[ observacionesFluidos ]], 
        },
      });

      const inspeccionRadiador = row[0][77];
      await this.sheets.spreadsheets.values.update({
        auth: this.auth,
        spreadsheetId: spreadsheetrev3,
        range: 'Hoja1!G41', 
        valueInputOption: 'RAW',
        requestBody: {
          values: [[ inspeccionRadiador ]], 
        },
      });

      const inspeccionMangueras = row[0][79];
      await this.sheets.spreadsheets.values.update({
        auth: this.auth,
        spreadsheetId: spreadsheetrev3,
        range: 'Hoja1!G42', 
        valueInputOption: 'RAW',
        requestBody: {
          values: [[ inspeccionMangueras  ]], 
        },
      });

      const inspeccionCorreas = row[0][81];
      await this.sheets.spreadsheets.values.update({
        auth: this.auth,
        spreadsheetId: spreadsheetrev3,
        range: 'Hoja1!G43', 
        valueInputOption: 'RAW',
        requestBody: {
          values: [[ inspeccionCorreas  ]], 
        },
      });

      const comprobacionFugas = row[0][83];
      await this.sheets.spreadsheets.values.update({
        auth: this.auth,
        spreadsheetId: spreadsheetrev3,
        range: 'Hoja1!G44', 
        valueInputOption: 'RAW',
        requestBody: {
          values: [[ comprobacionFugas  ]], 
        },
      });

      const observacionGeneral = row[0][84];

      await this.sheets.spreadsheets.values.update({
        auth: this.auth,
        spreadsheetId: spreadsheetrev3,
        range: 'Hoja1!H45', 
        valueInputOption: 'RAW',
        requestBody: {
          values: [[ observacionGeneral   ]], 
        },
      });

      // Luces
      const lucesMedias = row[0][80];
      const lucesRetroceso = row[0][81];
      const lucesDerechas = row[0][82];
      const lucesIzquierdas = row[0][83];
      const lucesIntermitentes = row[0][84];
      const lucesStops = row[0][85];
      const lucesCabina = row[0][86];
      const lucesEscolta = row[0][87];

      // Seguridad
      const primerosAuxilios = row[0][88];
      const conos = row[0][89];
      const triangulos = row[0][90];
      const cuñas = row[0][91];
      const extintor = row[0][92];
      const llantaRepuesto = row[0][93];
      const gato = row[0][94];
      const carretilla = row[0][95];

      // Documentos
      const permisoBimensual = row[0][96];
      const permisoAnual = row[0][97];
      const polizaSeguro = row[0][98];
      const tarjetaPesos = row[0][99];
      const licenciaConducir = row[0][100];
      const hojaSeguridad = row[0][101];
      const planEmergencia = row[0][102];
      const registroVehicular = row[0][103];

      // Daños
      const dano1 = row[0][104];
      const dano1Frontal = row[0][105];
      const dano1Obs1 = row[0][106];
      const dano1Obs2 = row[0][107];
      const dano1Obs3 = row[0][108];

      const dano2 = row[0][109];
      const dano2Posterior = row[0][110];
      const dano2Obs1 = row[0][111];
      const dano2Obs2 = row[0][112];
      const dano2Obs3 = row[0][113];

      const dano3 = row[0][114];
      const dano3LateralIzq = row[0][115];
      const dano3Obs1 = row[0][116];
      const dano3Obs2 = row[0][117];
      const dano3Obs3 = row[0][118];

      const dano4 = row[0][119];
      const dano4LateralDer = row[0][120];
      const dano4Obs1 = row[0][121];
      const dano4Obs2 = row[0][122];
      const dano4Obs3 = row[0][123];

      // Revisión final
      const revisionGolpes = row[0][124];
      const revisionLlave = row[0][125];
      const revisionBasura = row[0][126];
      const revisionLuces = row[0][127];
      const maletinPrimerosAuxilios = row[0][128];
      const revisionConos = row[0][129];
      const revisionTriangulos = row[0][130];
      const revisionExtintor = row[0][131];
      const revisionLlantaRepuesto = row[0][132];
      const revisionGato = row[0][133];
      const revisionCarretilla = row[0][134];
      const revisionCuñas = row[0][135];

      // Observaciones generales
      const observacionGeneralDatos = row[0][136];

    } catch (error) {
      console.error('Error al obtener los datos de la fila de Google Sheets:', error.response?.data || error.message || error);
      throw new Error('Error al obtener los datos de la fila de Google Sheets');
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
