import {google} from 'googleapis';
import * as fs from 'fs';

export class SheetFunctions{

    public id_odgovaranja:string;
    public auth;
    public client;
    public gsheet;

    constructor(){
        
        this.id_odgovaranja = JSON.parse(fs.readFileSync("./id_odgovaranja.json", 'utf-8')).id;
        this.auth = undefined;
        this.client = undefined;
        this.gsheet = undefined;

    }

    private async createCredentials(){
        this.auth = new google.auth.GoogleAuth({
            keyFile: "credentials.json",
            scopes : "https://www.googleapis.com/auth/spreadsheets",
        });
        this.client = await this.auth.getClient();
        this.gsheet = google.sheets({version:"v4", auth: this.client});
    }

    private async getDataFromSpreadsheet(range:string){

        if(this.auth === undefined)
            await this.createCredentials();

        const data = await this.gsheet.spreadsheets.values.get({
            auth : this.auth,
            spreadsheetId : this.id_odgovaranja,
            range: range,
        })
        console.log(data);
        
        return data;
    }

    private async updateDataSpreadSheet(range: string, value){
        
        if(this.auth === undefined)
            await this.createCredentials();

        await this.gsheet.spreadsheets.values.update({
            spreadsheetId : this.id_odgovaranja,
            range : range,
            includeValuesInResponse : false,
            valueInputOption : "RAW",
            requestBody : {
                majorDimension : "ROWS",
                values : [value]
            }
         });    
    }

    private async batchUpdate(range: string,title: string, request){

        if(this.auth === undefined)
            await this.createCredentials();

        await this.gsheet.spreadsheets.batchUpdate(request, async (err, response) => {
            if (err) {
                console.log("Error, nije kreiran sheet!");            
            }
            else{
                await this.gsheet.spreadsheets.values.append({
                    spreadsheetId : this.id_odgovaranja,
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
                await this.gsheet.spreadsheets.values.append({
                    spreadsheetId : this.id_odgovaranja,
                    range: range,
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

    }

    public async togglePoslednjeOdgovaranje(){    
        const data = await this.getDataFromSpreadsheet("odg");

        let value = data.data.values[data.data.values.length-1];
        value[1] = value[1] === "FALSE" ? "TRUE" : "FALSE";

        await this.updateDataSpreadSheet("odg!A"+ data.data.values.length + ":B"+data.data.values.length,value);

        return value[1];
    }

    public async kreirajSheetZaOdgovaranje() : Promise<string>{

        let title = "odgovaranje" + (new Date).getTime().toString();
        const request = {
            "spreadsheetId": this.id_odgovaranja,
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

        await this.batchUpdate("odg",title, request);
        return title;
    }
    public async vratiTitlePoslednjegOdgovaranja() : Promise<string>{
        let title = "";

        const data = await this.getDataFromSpreadsheet("odg!C1");
        title = data.data.values[0][0];
        return title;
    }


    public async prijavljivanjeNaPoslednjeOdgovaranje(ca:string, user:string, index:number) : Promise<boolean>{

        let title = await this.vratiTitlePoslednjegOdgovaranja();

        await this.gsheet.spreadsheets.values.append({
            spreadsheetId : this.id_odgovaranja,
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

    public async vratiPodatkeSaPoslednjegOdgovaranja(){

        let title = await this.vratiTitlePoslednjegOdgovaranja();

        const data = await this.getDataFromSpreadsheet(title + "!A2:C");

        return data.data.values;
    }

    public async vratiPoslednjeKorisnikeUTabeli() : Promise<{korisnici : string[][], omoguceno : string}>{

        const data = await this.getDataFromSpreadsheet("odg!C1:D1");
        let title = data.data.values[0][0];
        let omoguceno = data.data.values[0][1];

        const data2 = await this.getDataFromSpreadsheet(title+"!A2:C");

        let vrednosti = [];

        data2.data.values.forEach((value,index) => {
            if(index >= data2.data.values.length -5)
                vrednosti.push(value);
        });

        while(vrednosti.length < 5)
            vrednosti.push(["", "", ""]);
        
        return {korisnici : vrednosti, omoguceno : omoguceno};
    }

    public async vratiContextSvihNaPoslednjemOdgovaranju(){
        let title = await this.vratiTitlePoslednjegOdgovaranja();

        const data = await this.getDataFromSpreadsheet(title+"!D2:D");

        return data.data.values;
    }
}