import { Injectable } from '@nestjs/common';
import { AppService } from 'src/app.service';
import { google } from 'googleapis';

@Injectable()
export class InsRegistroSalidaService {

  private sheets: any;
  private auth: any;

  constructor(private readonly appService: AppService) {
    this.auth = this.appService['auth'];
    this.sheets = google.sheets({ version: 'v4', auth: this.auth });
  }

  async handleData(
    placa: string,
    conductor: string,
    sucursal: string,
    tipoVehiculo: string,
    odometroSalida: string,
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
    danosCarroceria: any[]
  ) {
    const spreadsheetId = process.env.GOOGLE_INSPECCIONSALIDAS;

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

      if (typeof llantasParte1 === "string") {
        try {
          llantasParte1 = JSON.parse(llantasParte1);
        } catch (error) {
          console.error("Error al analizar la cadena JSON:", error);
        }
      }

      if (typeof llantasParte2 === "string") {
        try {
          llantasParte2 = JSON.parse(llantasParte2);
        } catch (error) {
          console.error("Error al analizar la cadena JSON:", error);
        }
      }

      if (typeof fluidos === "string") {
        try {
          fluidos = JSON.parse(fluidos);
        } catch (error) {
          console.error("Error al analizar la cadena JSON:", error);
        }
      }

      if (typeof parametrosVisuales === "string") {
        try {
          parametrosVisuales = JSON.parse(parametrosVisuales);
        } catch (error) {
          console.error("Error al analizar la cadena JSON:", error);
        }
      }

      if (typeof luces === "string") {
        try {
          luces = JSON.parse(luces);
        } catch (error) {
          console.error("Error al analizar la cadena JSON:", error);
        }
      }

      if (typeof insumos === "string") {
        try {
          insumos = JSON.parse(insumos);
        } catch (error) {
          console.error("Error al analizar la cadena JSON:", error);
        }
      }

      if (typeof documentacion === "string") {
        try {
          documentacion = JSON.parse(documentacion);
        } catch (error) {
          console.error("Error al analizar la cadena JSON:", error);
        }
      }

      if (typeof danosCarroceria === "string") {
        try {
          danosCarroceria = JSON.parse(danosCarroceria);
        } catch (error) {
          console.error("Error al analizar la cadena JSON:", error);
        }
      }

      const llanta1 = llantasParte1[0];
      const llanta2 = llantasParte1[1];
      const llanta3 = llantasParte1[2];
      const llanta4 = llantasParte1[3];
      const llanta5 = llantasParte1[4];

      const llanta6 = llantasParte2[0];
      const llanta7 = llantasParte2[1];
      const llanta8 = llantasParte2[2];
      const llanta9 = llantasParte2[3];
      const llanta10 = llantasParte2[4];

      const fluido1 = fluidos[0];
      const fluido2 = fluidos[1];
      const fluido3 = fluidos[2];
      const fluido4 = fluidos[3];

      const parametros1 = parametrosVisuales[0];
      const parametros2 = parametrosVisuales[1];
      const parametros3 = parametrosVisuales[2];
      const parametros4 = parametrosVisuales[3];

      const luces1 = luces[0];
      const luces2 = luces[1];
      const luces3 = luces[2];
      const luces4 = luces[3];
      const luces5 = luces[4];
      const luces6 = luces[5];
      const luces7 = luces[6];
      const luces8 = luces[7];

      const insumo1 = insumos[0];
      const insumo2 = insumos[1];
      const insumo3 = insumos[2];
      const insumo4 = insumos[3];
      const insumo5 = insumos[4];
      const insumo6 = insumos[5];
      const insumo7 = insumos[6];
      const insumo8 = insumos[7];

      const documentacion1 = documentacion[0];
      const documentacion2 = documentacion[1];
      const documentacion3 = documentacion[2];
      const documentacion4 = documentacion[3];
      const documentacion5 = documentacion[4];
      const documentacion6 = documentacion[5];
      const documentacion7 = documentacion[6];
      const documentacion8 = documentacion[7];

      const danosCarroceria1 = danosCarroceria[0];
      const danosCarroceria2 = danosCarroceria[1];
      const danosCarroceria3 = danosCarroceria[2];
      const danosCarroceria4 = danosCarroceria[3];

      const values = [[
        fechaHoraActual,
        placa,
        conductor,
        sucursal,
        tipoVehiculo,
        odometroSalida,
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

        "Daño 2",  danosCarroceria2?.vista, danosCarroceria2?.rayones ? "sí" : "no", danosCarroceria2?.golpes ? "sí" : "no", danosCarroceria2?.quebrado ? "sí" : "no",
        danosCarroceria2?.faltante ? "sí" : "no",

        "Daño 3",  danosCarroceria3?.vista, danosCarroceria3?.rayones ? "sí" : "no", danosCarroceria3?.golpes ? "sí" : "no", danosCarroceria3?.quebrado ? "sí" : "no",
        danosCarroceria3?.faltante ? "sí" : "no",

        "Daño 4",  danosCarroceria4?.vista, danosCarroceria4?.rayones ? "sí" : "no", danosCarroceria4?.golpes ? "sí" : "no", danosCarroceria4?.quebrado ? "sí" : "no",
        danosCarroceria4?.faltante ? "sí" : "no"
      ]];

      await this.sheets.spreadsheets.values.append({
        auth: this.auth,
        spreadsheetId,
        range: 'Hoja 1!A2',
        valueInputOption: 'RAW',
        requestBody: {
          values: values,
        },
      });

      console.log('Datos enviados correctamente a Google Sheets.');
    } catch (error) {
      console.error(
        'Error al procesar datos o subir el archivo:',
        error.response?.data || error.message || error
      );
      throw new Error('Error al procesar datos o subir el archivo');
    }

    return { message: 'Datos procesados y almacenados correctamente en Google Sheets' };
  }

}
