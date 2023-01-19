import {google, sheets_v4} from 'googleapis';
import * as fs from 'fs';
import { StudentTabela } from '../AdaptiveCardsInterfaces/StudentTabela';
import {TabelaKorisnika} from '../AdaptiveCardsInterfaces/TabelaKorisnika';
export class SheetFunctions{

    public id_odgovaranja:string;
    public auth;
    public client;
    public gsheet : sheets_v4.Sheets | undefined;

    constructor(){
        
        this.id_odgovaranja = JSON.parse(fs.readFileSync("C:/home/site/wwwroot/id_odgovaranja.json", 'utf-8')).id;
        this.auth = undefined;
        this.client = undefined;
        this.gsheet = undefined;

    }

    private async createCredentials(){
        this.auth = new google.auth.GoogleAuth({
            keyFile: "../credentials.json",
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
                            ["Ime", "Index", "Odgovarao", "Context", "Vreme Odgovaranja"]
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

    private async deleteRow(request){
        if(this.auth === undefined)
        await this.createCredentials();

        await this.gsheet.spreadsheets.batchUpdate(request, async (err, response) => {
            if (err) {
                console.log("Error, nije obrisan red");            
            }
        });
    }

    private async getSheetId(title){
        const request = {
            spreadsheetId: this.id_odgovaranja,
            ranges: [title],  
            includeGridData: false,  
        
            auth: this.auth,
          };
        const response = (await this.gsheet.spreadsheets.get(request)).data; 
        return  response.sheets[0].properties.sheetId;
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

        let data = await this.getDataFromSpreadsheet("odg!C1:D1");
        if(data.data.values[0][1] === "FALSE")
            return false;
        
        let title = data.data.values[0][0];
        await this.gsheet.spreadsheets.values.append({
            spreadsheetId : this.id_odgovaranja,
            range : title,
            insertDataOption: 'INSERT_ROWS',
            includeValuesInResponse: true,
            valueInputOption : 'RAW',
            requestBody : {
                values : [
                    [user, index, "FALSE", ca]
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
        console.log("OK");
        if(data2.data.values !== undefined){
            data2.data.values.forEach((value,index) => {
                if(value[2] === "FALSE")
                vrednosti.push(value);
            });
        }
        console.log("OK2");

        while(vrednosti.length < 5)
            vrednosti.push(["", "", ""]);
        
        return {korisnici : vrednosti, omoguceno : omoguceno};
    }

    public async vratiContextSvihNaPoslednjemOdgovaranju(){
        let title = await this.vratiTitlePoslednjegOdgovaranja();

        const data = await this.getDataFromSpreadsheet(title+"!D2:D");
        if(data.data.values === undefined || data.data.values === null)
            return null;
        return data.data.values;
    }

    public async vratiPoslednjStudenteZaTrenutnoOdgovaranje(userID : string) : Promise<{data : string[][], userTime : number}>{
        let title = await this.vratiTitlePoslednjegOdgovaranja();

        const data = await this.getDataFromSpreadsheet(title+"!A2:E");
        if(data.data.values == undefined || data.data.values == null)
            return {data : null, userTime : 0};
        if(data.data.values.length < 4){
            let values = [];
            data.data.values.forEach(e => {
                if(e[2] === "FALSE")
                    values.push([e[0], e[1], "?"]);
            });
            while(values.length < 3)
                values.push(["", "", ""]);
            return {data : values, userTime : 0};
        }
        let dates : Date[] = [];
        let sum = 0;
        data.data.values.forEach(e=>{
            if(e[2] === "TRUE"){
                let  ndate = new Date();
                ndate.setTime(Number.parseInt(e[4]));
                if(dates.length > 1){
                    sum += ndate.getTime() - dates[dates.length-1].getTime();
                }
                dates.push(ndate);
            }
        })
        let userTime = 0;
        let average = sum / (dates.length-1); // milisekunde
        let last : number = 0;
        let values = [];
        for(let i = 0; i < data.data.values.length; i++){
            if(data.data.values[i][2] === "TRUE"){
                last = Number.parseInt(data.data.values[i][4]);
            }
            if(data.data.values[i][2] === "FALSE"){
                last += average;
                let time = Math.ceil((last - Date.now()) / (60 * 1000));
                if(JSON.parse(data.data.values[i][3]).conv.user.id === userID && userTime === 0){
                    userTime =time;
                }
                values.push([data.data.values[i][0], data.data.values[i][1], dates.length > 2 ? ("" + time + " min") : "?"]); // vraca u broj minuta
            }
        }
        while(values.length < 7)
            values.push(["","",""]);
        if(dates.length < 2)
            userTime = 0;
        return {data  : values, userTime};
    }

    public async zavrsiOdgovaranje(userID: String)  : Promise<boolean>{
        let title = await this.vratiTitlePoslednjegOdgovaranja();
        const data = await this.getDataFromSpreadsheet(title+"!A2:E");
        if(data.data.values == undefined || data.data.values == null)
            return false;
        let index = -1;

        for(let i = 0; i < data.data.values.length && index === -1; i++){
            let ca = JSON.parse(data.data.values[i][3]);
            if(ca.conv.user.id === userID && data.data.values[i][2] === "FALSE"){
                index = i;
            }
        }
        if(index === -1)
            return false;
        let value = data.data.values[index];
        index+=2;
        value[2] = "TRUE";
        value[4] = Date.now();
        let range = title+"!A" + index+ ":E" + index;
        console.log(range);
        await this.updateDataSpreadSheet(range, value);
        return true;
    }

    public async obavestiPoslednjeg(){
        let title = await this.vratiTitlePoslednjegOdgovaranja();
        let data = await this.getDataFromSpreadsheet(title + "!A2:E");
        if(data.data.values === undefined || data.data.values === null)
            return null;
        let context = undefined;
        let ind;
        for(let i=data.data.values.length-1; i >= 0; i--){
            if(data.data.values[i][2] == 'TRUE'){
                ind = i;
                context = data.data.values[i][3];
                break;
            }
        }
        if(context != undefined){
            let value = data.data.values[ind];
            ind += 2;
            await this.updateDataSpreadSheet(title + "!A" + ind + ":E"+ind, value);
        }
        return context;
    }

    public async obavestiSledeceg(){
        let title = await this.vratiTitlePoslednjegOdgovaranja();
        let data = await this.getDataFromSpreadsheet(title + "!A2:E");
        if(data.data.values != undefined){
            let context;
            for(let i=0; i<data.data.values.length; i++){
                if(data.data.values[i][2] == "FALSE"){
                    context = data.data.values[i][3];
                    break;
                }
            }
            return context;
        }
        return null;
    }

    public async odjavaStudenta(userId:String) : Promise<boolean>{
        let title = await this.vratiTitlePoslednjegOdgovaranja();
        let data = await this.getDataFromSpreadsheet(title + "!A2:E");
        if(data.data.values == undefined || data.data.values == null)
            return false;
        let uspesno: boolean = false;
        let index = -1;
        for(let i = 0; i < data.data.values.length; i++){
            let ca = JSON.parse(data.data.values[i][3]);
            if(ca.conv.user.id === userId){
               index = i;
               uspesno = true;
               break;
            }
        }
        if (uspesno){
            let id = await this.getSheetId(title);
            const request2 = {
                "spreadsheetId": this.id_odgovaranja,
                "requestBody": {
                    "requests": [{
                        "deleteDimension": {
                            "range": {
                              "sheetId": id,
                              "dimension": "ROWS",
                              "startIndex": index + 1,
                              "endIndex": index + 2
                            }
                        }
                    }]
                }
            };
            await this.deleteRow(request2);
        }
        return uspesno;
    }
    public async InitializeSheet(idOdg : string) {
        if(this.auth === undefined)
            await this.createCredentials();
        let title = "odg"
        this.id_odgovaranja = idOdg;
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

        await this.gsheet.spreadsheets.batchUpdate(request, async (err, response) => {
            await this.gsheet.spreadsheets.values.update({
                spreadsheetId : this.id_odgovaranja,
                range : "odg",
                includeValuesInResponse : false,
                valueInputOption : "USER_ENTERED",
                requestBody : {
                    majorDimension : "ROWS",
                    values : [[
                        "Title",
                        "Omoguceno",
                        "=INDEX(A:A, MAX(COUNTA(A:A)), 1)",
                        "=INDEX(B:B, MAX(COUNTA(B:B)), 1)"
                    ]],
                }
            });  
        });
    }
}