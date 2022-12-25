import {google} from 'googleapis';
import * as fs from 'fs';
export async function getInfoFromTable(sheetID : string){
    //load credentials
    const auth = new google.auth.GoogleAuth({
        keyFile: "credentials.json",
        scopes : "https://www.googleapis.com/auth/spreadsheets",
    });
    //log in and get a client
    const client = await auth.getClient();
    //sheets client
    const gsheet = google.sheets({version:"v4", auth: client});
    //const sheetID = "1BLF6J_ORoPdsw_V868zrAI6TVLDsbn9ewSU9WlGolD4";

    const data = await gsheet.spreadsheets.values.get({
        auth : auth,
        spreadsheetId : sheetID,
        range: "prvo_odgovaranje",
    })
    console.log(data);
    
    return data;
}
export async function dodajUTabeluZaOdgovaranje(id : string, title : string) {
    const auth = new google.auth.GoogleAuth({
        keyFile: "credentials.json",
        scopes : "https://www.googleapis.com/auth/spreadsheets",
    });
    const client = await auth.getClient();
    const gsheet = google.sheets({version:"v4", auth: client});
    let id_odg;
    try{
        id_odg = JSON.parse(fs.readFileSync("./id_odgovaranja.json", 'utf-8')).id;
    } catch(err){
        console.log(err);
    }
    await gsheet.spreadsheets.values.append({
        spreadsheetId : id_odg,
        range: "odg",
        insertDataOption: 'INSERT_ROWS',
        includeValuesInResponse: true,
        valueInputOption : 'RAW',
        requestBody : {
            values : [
                [id, title]
            ]
        }
    });
}
export async function kreirajTabeluZaOdgovaranje() : Promise<string>{
    const auth = new google.auth.GoogleAuth({
        keyFile: "credentials.json",
        scopes : "https://www.googleapis.com/auth/spreadsheets",
    });
    const client = await auth.getClient();
    const gsheet = google.sheets({version:"v4", auth: client});
    let title = "odgovaranje" + (new Date).getTime().toString();
    try {
        const spreadsheet = await gsheet.spreadsheets.create({requestBody : {properties : {title : title}}});
        await dodajUTabeluZaOdgovaranje(spreadsheet.data.spreadsheetId, title);
        console.log(spreadsheet.data.spreadsheetId)
        return spreadsheet.data.spreadsheetId;
      } catch (err) {
        throw err;
      }
}

export async function preuzmiInformacijeOdgovaranja(sheetID: string, id_odgovaranja:string){
    
   try{
        let sheet = await getInfoFromTable(sheetID);
        let data = sheet.data.values;
        let rez = [[]];
        // rez[0][0] = data[0][0];  rez[0][1] = data[0][1]; rez[0][2] = data[0][2]; rez[0][3] = data[0][3]; rez[0][4] = data[0][4];
        // let j = 0;
        // data.forEach((e, i) => {
        // if(i != 0 ){
        //     rez[j][0] = data[i][0];  rez[j][1] = data[i][1]; rez[j][2] = data[i][2]; rez[j][3] = data[i][3]; rez[j][4] = data[i][4];
        //     j++;
        // }
        // });
        return data;
   }catch(err){
    throw err;
   }
}