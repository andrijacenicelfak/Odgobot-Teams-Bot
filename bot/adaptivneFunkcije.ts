import * as sf from "./SheetsFunctions"
import * as fs from 'fs';

export function kreirajOdgovaranje(){
    return sf.kreirajTabeluZaOdgovaranje();
}

export async function preuzmiInformacijeOdgovaranja(sheetID : string){
    let data =  await sf.preuzmiInformacijeOdgovaranja(sheetID);
    return data;
}

export async function toggleOmoguceno(){
    //TODO treba da vrati celu tabelu
    return sf.togglePoslednjeOdgovaranje();
}