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
    console.log(data);
    
    return data;
}
export async function vratiPodatkeSvihOdgovaranja() {
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
    const data = await gsheet.spreadsheets.values.get({
        auth : auth,
        spreadsheetId : id_odg,
        range: "odg",
    })
    return data
}
export async function togglePoslednjeOdgovaranje(){
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
    const data = await gsheet.spreadsheets.values.get({
        auth : auth,
        spreadsheetId : id_odg,
        range: "odg",
    })
    let value = data.data.values[data.data.values.length-1];
    value[1] = value[1] === "FALSE" ? "TRUE" : "FALSE";
    await gsheet.spreadsheets.values.update({
        spreadsheetId : id_odg,
        range : "odg!A"+ data.data.values.length + ":B"+data.data.values.length,
        includeValuesInResponse : false,
        valueInputOption : "RAW",
        requestBody : {
            majorDimension : "ROWS",
            values : [value]
        }
    });
    return value[1]
}

//DEPRICATED
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
                [id, title, "TRUE"]
            ]
        }
    });
}

// DEPRICATED!
export async function kreirajTabeluZaOdgovaranje() : Promise<string>{
    const auth = new google.auth.GoogleAuth({
        keyFile: "credentials.json",
        scopes : "https://www.googleapis.com/auth/spreadsheets",
    });
    const client = await auth.getClient();
    const gsheet = google.sheets({version:"v4", auth: client});
    let title = "odgovaranje" + (new Date).getTime().toString();
    try {
        const spreadsheet = await gsheet.spreadsheets.create(
            {
                requestBody : {
                    properties : {
                        title : title
                    },

                }
            }
        );
        let nid = spreadsheet.data.spreadsheetId;
        await dodajUTabeluZaOdgovaranje(spreadsheet.data.spreadsheetId, title);
        
        await gsheet.spreadsheets.values.append({
            spreadsheetId : nid,
            range: "Sheet1",
            insertDataOption: 'INSERT_ROWS',
            includeValuesInResponse: true,
            valueInputOption : 'RAW',
            requestBody : {
                values : [
                    ["Ime", "Index", "Context"]
                ],
            }
        });

        // await gsheet.spreadsheets.values.update({
        //     spreadsheetId : nid,
        //     requestBody : {
        //     }
        // });

        return spreadsheet.data.spreadsheetId;
      } catch (err) {
        throw err;
      }
}

export async function kreirajSheetZaOdgovaranje() : Promise<string> {
    const auth = new google.auth.GoogleAuth({
        keyFile: "credentials.json",
        scopes : "https://www.googleapis.com/auth/spreadsheets",
    });
    const client = await auth.getClient();
    const gsheet = google.sheets({version:"v4", auth: client});
    let title = "odgovaranje" + (new Date).getTime().toString();

    let id_odg;
    try{
        id_odg = JSON.parse(fs.readFileSync("./id_odgovaranja.json", 'utf-8')).id;
    } catch(err){
        console.log(err);
    }

    const request = {
        "spreadsheetId": id_odg,
        "resource": {
            "requests": [{
               "addSheet": {
                    "properties": {
                        "title": title
                    }
                }
            }]
        }
    };

    await gsheet.spreadsheets.batchUpdate(request, async (err, response) => {
        if (err) {
            console.log("Error, nije kreiran sheet!");            
        }
        else{
            await gsheet.spreadsheets.values.append({
                spreadsheetId : id_odg,
                range: title,
                insertDataOption: 'INSERT_ROWS',
                includeValuesInResponse: true,
                valueInputOption : 'RAW',
                requestBody : {
                    values : [
                        ["Ime", "Index", "Odgovarao", "Context"]
                    ],
                }
            });
            await gsheet.spreadsheets.values.append({
                spreadsheetId : id_odg,
                range: "odg",
                insertDataOption: 'INSERT_ROWS',
                includeValuesInResponse: true,
                valueInputOption : 'RAW',
                requestBody : {
                    values : [
                        [title, "TRUE"]
                    ]
                }
            });
        }
    });

    return title;
}

export async function vratiTitlePoslednjegOdgovaranja() : Promise <string>{
    let title = "";
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

    const data = await gsheet.spreadsheets.values.get({
        auth : auth,
        spreadsheetId : id_odg,
        range: "odg!C1",
    });
    title = data.data.values[0][0]
    return title;
}

export async function prijaviNaPoslednjeOdgovaranje(ca : string, user : string, index : number) : Promise<boolean>{
    let title = await vratiTitlePoslednjegOdgovaranja();
    
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
        range : title,
        insertDataOption: 'INSERT_ROWS',
        includeValuesInResponse: true,
        valueInputOption : 'RAW',
        requestBody : {
            values : [
                [user, index, "False", ca]
            ]
        }
    });

    return true;
}

export async function vratiPodatkeSaPoslednjegOdgovaranja(){
    let title = await vratiTitlePoslednjegOdgovaranja();
    
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

    const data = await gsheet.spreadsheets.values.get({
        auth : auth,
        spreadsheetId : id_odg,
        range: title + "!A2:C",
    })

    return data.data.values;
}

export async function vratiPoslednjeKorisnikeUTabeli() : Promise<{korisnici : string[][], omoguceno : string}>{
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

    const data = await gsheet.spreadsheets.values.get({
        auth : auth,
        spreadsheetId : id_odg,
        range: "odg!C1:D1",
    });
    let title = data.data.values[0][0];
    let omoguceno = data.data.values[0][1];

    const data2 = await gsheet.spreadsheets.values.get({
        auth : auth,
        spreadsheetId : id_odg,
        range: title+"!A2:C"
    });

    let vrednosti = [];
    data2.data.values.forEach((value, index)=>{
        if(index >= data2.data.values.length - 5)
            vrednosti.push(value);
    });
    while(vrednosti.length < 5)
        vrednosti.push(["", "", ""]);

    return {korisnici : vrednosti, omoguceno : omoguceno};
}

export async function vratiContextSvihNaPoslednjemOdogvaranju(){
    let title = await vratiTitlePoslednjegOdgovaranja();

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

    let data = await gsheet.spreadsheets.values.get({
        auth : auth,
        spreadsheetId : id_odg,
        range : title+"!D2:D",
    });
    return data.data.values;
}