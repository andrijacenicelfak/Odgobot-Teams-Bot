import * as sf from "./SheetsFunctions"
import * as fs from 'fs';
import { ConvActiv } from "./ConvActiv";
import { TabelaKorisnika } from "./AdaptiveCardsInterfaces/TabelaKorisnika";
export function kreirajOdgovaranje(){
    return sf.kreirajSheetZaOdgovaranje();
}

export async function toggleOmoguceno(){
    return sf.togglePoslednjeOdgovaranje();
}
export async function prijaviSeNaOdgovaranje(ca : ConvActiv, user : string, index : string) {
    // TODO proveri da li moze da se doda
    let caString = JSON.stringify(ca);
    let indexNum = Number.parseInt(index);
    return await sf.prijaviNaPoslednjeOdgovaranje(caString, user, indexNum);
}

export async function karticaRedOdgovaranjaProfesor() {
    let vrednost : TabelaKorisnika;
    let pov = await sf.vratiPoslednjeKorisnikeUTabeli();
    vrednost.vrednosti = [];
    pov.korisnici.forEach(v=>{
        vrednost.vrednosti.push(v[0]);
        vrednost.vrednosti.push(v[1]);
        vrednost.vrednosti.push(v[2]);
    });
    vrednost.omoguceno = pov.omoguceno;
    return vrednost;
}
