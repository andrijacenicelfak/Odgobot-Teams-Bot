import * as sf from "./SheetsFunctions"
import * as fs from 'fs';

export function kreirajOdgovaranje(){
    return sf.kreirajTabeluZaOdgovaranje();
}

export async function preuzmiInformacijeOdgovaranja(sheetID : string){
    let id_odgovaranja = JSON.parse(fs.readFileSync("./id_odgovaranja.json", 'utf-8')).id;
    let data =  await sf.preuzmiInformacijeOdgovaranja(sheetID,id_odgovaranja);
    let odgovaranje = JSON.parse(fs.readFileSync("./adaptiveCards/profesor_red_odgovaranja.json", 'utf-8'));
    
    console.log("Profesor red odgovaranja");
    console.log(odgovaranje);
    return data;
}