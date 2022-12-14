import {google} from 'googleapis'
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