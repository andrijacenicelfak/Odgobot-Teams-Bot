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
        range: "Sheet1",
    })

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