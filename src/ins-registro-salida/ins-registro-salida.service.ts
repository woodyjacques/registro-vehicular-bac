import { Injectable } from '@nestjs/common';
import { AppService } from 'src/app.service';
import { google } from 'googleapis';
import { SalidasService } from 'src/salidas/salidas.service';
import * as dotenv from 'dotenv';
dotenv.config();

@Injectable()
export class InsRegistroSalidaService {

  private sheets: any;
  private auth: any;

  constructor(
    private readonly appService: AppService,
    private readonly salidasService: SalidasService,
  ) {
    this.auth = this.appService['auth'];
    this.sheets = google.sheets({ version: 'v4', auth: this.auth })
  }

  async handleData(
    placa: string,
    conductor: string,
    sucursal: string,
    tipoVehiculo: string,
    odometroSalida: string,
    estadoSalida: string,
    llantasParte1: any[],
    llantasParte2: any[],
    observacionGeneralLlantas: string,
    fluidos: any[],
    observacionGeneralFluido: string,
    parametrosVisuales: any[],
    observacionGeneralVisuales: string,
    luces: any[],
    insumos: any[],
    documentacion: any[],
    danosCarroceria: any[],
  ) {
    const spreadsheetId = process.env.GOOGLE_INSPECCIONSALIDAS;
    console.log(spreadsheetId);

    try {
      const fechaHoraActual = new Date().toLocaleString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });

      const HoraSalida = new Date().toLocaleString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });

      llantasParte1 = this.processJSON(llantasParte1);
      llantasParte2 = this.processJSON(llantasParte2);
      fluidos = this.processJSON(fluidos);
      parametrosVisuales = this.processJSON(parametrosVisuales);
      luces = this.processJSON(luces);
      insumos = this.processJSON(insumos);
      documentacion = this.processJSON(documentacion);
      danosCarroceria = this.processJSON(danosCarroceria);

      const arrays = this.initializeArrays({
        llantasParte1,
        llantasParte2,
        fluidos,
        parametrosVisuales,
        luces,
        insumos,
        documentacion,
        danosCarroceria,
      });

      const values = this.buildValues({
        fechaHoraActual,
        placa,
        conductor,
        sucursal,
        tipoVehiculo,
        odometroSalida,
        estadoSalida,
        observacionGeneralLlantas,
        observacionGeneralFluido,
        observacionGeneralVisuales,
        ...arrays,
      });

      const response = await this.sheets.spreadsheets.values.append({
        auth: this.auth,
        spreadsheetId,
        range: 'Hoja 1!A2',
        valueInputOption: 'RAW',
        requestBody: {
          values: values,
        },
      });

      const updatedRange = response.data.updates.updatedRange;
      const filaInsertada = parseInt(updatedRange.match(/\d+/g).pop(), 10);

      await this.sheets.spreadsheets.values.update({
        auth: this.auth,
        spreadsheetId,
        range: `Hoja 1!GF${filaInsertada}`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [[HoraSalida]],
        },
      });

      await this.salidasService.handleDataSalida(placa, conductor, fechaHoraActual, sucursal, HoraSalida);

      console.log('Datos enviados correctamente a Google Sheets.');
      return { message: 'Datos procesados y almacenados correctamente en Google Sheets' };
    } catch (error) {
      console.error('Error al procesar datos o subir el archivo:', error.response?.data || error.message || error);
      throw new Error('Error al procesar datos o subir el archivo');
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
    llantasParte1,
    llantasParte2,
    fluidos,
    parametrosVisuales,
    luces,
    insumos,
    documentacion,
    danosCarroceria,
  }: any) {
    return {
      llanta1: llantasParte1[0],
      llanta2: llantasParte1[1],
      llanta3: llantasParte1[2],
      llanta4: llantasParte1[3],
      llanta5: llantasParte1[4],
      llanta6: llantasParte2[0],
      llanta7: llantasParte2[1],
      llanta8: llantasParte2[2],
      llanta9: llantasParte2[3],
      llanta10: llantasParte2[4],
      fluido1: fluidos[0],
      fluido2: fluidos[1],
      fluido3: fluidos[2],
      fluido4: fluidos[3],
      parametros1: parametrosVisuales[0],
      parametros2: parametrosVisuales[1],
      parametros3: parametrosVisuales[2],
      parametros4: parametrosVisuales[3],
      luces1: luces[0],
      luces2: luces[1],
      luces3: luces[2],
      luces4: luces[3],
      luces5: luces[4],
      luces6: luces[5],
      luces7: luces[6],
      luces8: luces[7],
      insumo1: insumos[0],
      insumo2: insumos[1],
      insumo3: insumos[2],
      insumo4: insumos[3],
      insumo5: insumos[4],
      insumo6: insumos[5],
      insumo7: insumos[6],
      insumo8: insumos[7],
      documentacion1: documentacion[0],
      documentacion2: documentacion[1],
      documentacion3: documentacion[2],
      documentacion4: documentacion[3],
      documentacion5: documentacion[4],
      documentacion6: documentacion[5],
      documentacion7: documentacion[6],
      documentacion8: documentacion[7],
      danosCarroceria1: danosCarroceria[0],
      danosCarroceria2: danosCarroceria[1],
      danosCarroceria3: danosCarroceria[2],
      danosCarroceria4: danosCarroceria[3],
    };
  }

  private buildValues({
    fechaHoraActual,
    placa,
    conductor,
    sucursal,
    tipoVehiculo,
    odometroSalida,
    estadoSalida,
    observacionGeneralLlantas,
    observacionGeneralFluido,
    observacionGeneralVisuales,
    ...arrays
  }: any) {
    const {
      llanta1, llanta2, llanta3, llanta4, llanta5,
      llanta6, llanta7, llanta8, llanta9, llanta10,
      fluido1, fluido2, fluido3, fluido4,
      parametros1, parametros2, parametros3, parametros4,
      luces1, luces2, luces3, luces4, luces5, luces6, luces7, luces8,
      insumo1, insumo2, insumo3, insumo4, insumo5, insumo6, insumo7, insumo8,
      documentacion1, documentacion2, documentacion3, documentacion4,
      documentacion5, documentacion6, documentacion7, documentacion8,
      danosCarroceria1, danosCarroceria2, danosCarroceria3, danosCarroceria4,
    } = arrays;

    return [
      [
        fechaHoraActual,
        placa,
        conductor,
        sucursal,
        tipoVehiculo,
        odometroSalida,
        estadoSalida,
        "llanta 1", llanta1?.fp ? "sí" : "no", llanta1?.pe ? "sí" : "no", llanta1?.pa ? "sí" : "no", llanta1?.desgaste ? "sí" : "no",
        "llanta 2", llanta2?.fp ? "sí" : "no", llanta2?.pe ? "sí" : "no", llanta2?.pa ? "sí" : "no", llanta2?.desgaste ? "sí" : "no",
        "llanta 3", llanta3?.fp ? "sí" : "no", llanta3?.pe ? "sí" : "no", llanta3?.pa ? "sí" : "no", llanta3?.desgaste ? "sí" : "no",
        "llanta 4", llanta4?.fp ? "sí" : "no", llanta4?.pe ? "sí" : "no", llanta4?.pa ? "sí" : "no", llanta4?.desgaste ? "sí" : "no",
        "llanta 5", llanta5?.fp ? "sí" : "no", llanta5?.pe ? "sí" : "no", llanta5?.pa ? "sí" : "no", llanta5?.desgaste ? "sí" : "no",
        "llanta 6", llanta6?.fp ? "sí" : "no", llanta6?.pe ? "sí" : "no", llanta6?.pa ? "sí" : "no", llanta6?.desgaste ? "sí" : "no",
        "llanta 7", llanta7?.fp ? "sí" : "no", llanta7?.pe ? "sí" : "no", llanta7?.pa ? "sí" : "no", llanta7?.desgaste ? "sí" : "no",
        "llanta 8", llanta8?.fp ? "sí" : "no", llanta8?.pe ? "sí" : "no", llanta8?.pa ? "sí" : "no", llanta8?.desgaste ? "sí" : "no",
        "llanta 9", llanta9?.fp ? "sí" : "no", llanta9?.pe ? "sí" : "no", llanta9?.pa ? "sí" : "no", llanta9?.desgaste ? "sí" : "no",
        "llanta 10", llanta10?.fp ? "sí" : "no", llanta10?.pe ? "sí" : "no", llanta10?.pa ? "sí" : "no", llanta10?.desgaste ? "sí" : "no",
        observacionGeneralLlantas,
        "Nivel 1", fluido1?.nombre, fluido1?.requiere ? "sí" : "no", fluido1?.lleno ? "sí" : "no",
        "Nivel 2", fluido2?.nombre, fluido2?.requiere ? "sí" : "no", fluido2?.lleno ? "sí" : "no",
        "Nivel 3", fluido3?.nombre, fluido3?.requiere ? "sí" : "no", fluido3?.lleno ? "sí" : "no",
        "Nivel 4", fluido4?.nombre, fluido4?.requiere ? "sí" : "no", fluido4?.lleno ? "sí" : "no",
        observacionGeneralFluido,
        "",
        parametros1?.nombre, parametros1?.si ? "sí" : "no",
        parametros2?.nombre, parametros2?.si ? "sí" : "no",
        parametros3?.nombre, parametros3?.si ? "sí" : "no",
        parametros4?.nombre, parametros4?.si ? "sí" : "no",
        observacionGeneralVisuales,
        "",
        luces1?.nombre, luces1?.funcionaSi ? "sí" : "no",
        luces2?.nombre, luces2?.funcionaSi ? "sí" : "no",
        luces3?.nombre, luces3?.funcionaSi ? "sí" : "no",
        luces4?.nombre, luces4?.funcionaSi ? "sí" : "no",
        luces5?.nombre, luces5?.funcionaSi ? "sí" : "no",
        luces6?.nombre, luces6?.funcionaSi ? "sí" : "no",
        luces7?.nombre, luces7?.funcionaSi ? "sí" : "no",
        luces8?.nombre, luces8?.funcionaSi ? "sí" : "no",
        "",
        insumo1?.nombre, insumo1?.disponibleSi ? "sí" : "no",
        insumo2?.nombre, insumo2?.disponibleSi ? "sí" : "no",
        insumo3?.nombre, insumo3?.disponibleSi ? "sí" : "no",
        insumo4?.nombre, insumo4?.disponibleSi ? "sí" : "no",
        insumo5?.nombre, insumo5?.disponibleSi ? "sí" : "no",
        insumo6?.nombre, insumo6?.disponibleSi ? "sí" : "no",
        insumo7?.nombre, insumo7?.disponibleSi ? "sí" : "no",
        insumo8?.nombre, insumo8?.disponibleSi ? "sí" : "no",
        "",
        documentacion1?.nombre, documentacion1?.disponibleSi ? "sí" : "no",
        documentacion2?.nombre, documentacion2?.disponibleSi ? "sí" : "no",
        documentacion3?.nombre, documentacion3?.disponibleSi ? "sí" : "no",
        documentacion4?.nombre, documentacion4?.disponibleSi ? "sí" : "no",
        documentacion5?.nombre, documentacion5?.disponibleSi ? "sí" : "no",
        documentacion6?.nombre, documentacion6?.disponibleSi ? "sí" : "no",
        documentacion7?.nombre, documentacion7?.disponibleSi ? "sí" : "no",
        documentacion8?.nombre, documentacion8?.disponibleSi ? "sí" : "no",
        "",
        "Daño 1", danosCarroceria1?.vista, danosCarroceria1?.rayones ? "sí" : "no", danosCarroceria1?.golpes ? "sí" : "no", danosCarroceria1?.quebrado ? "sí" : "no",
        danosCarroceria1?.faltante ? "sí" : "no",
        "Daño 2", danosCarroceria2?.vista, danosCarroceria2?.rayones ? "sí" : "no", danosCarroceria2?.golpes ? "sí" : "no", danosCarroceria2?.quebrado ? "sí" : "no",
        danosCarroceria2?.faltante ? "sí" : "no",
        "Daño 3", danosCarroceria3?.vista, danosCarroceria3?.rayones ? "sí" : "no", danosCarroceria3?.golpes ? "sí" : "no", danosCarroceria3?.quebrado ? "sí" : "no",
        danosCarroceria3?.faltante ? "sí" : "no",
        "Daño 4", danosCarroceria4?.vista, danosCarroceria4?.rayones ? "sí" : "no", danosCarroceria4?.golpes ? "sí" : "no", danosCarroceria4?.quebrado ? "sí" : "no",
        danosCarroceria4?.faltante ? "sí" : "no"
      ],
    ];
  }

}
