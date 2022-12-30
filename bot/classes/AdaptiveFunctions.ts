
import { SheetFunctions } from "./SheetFunctions";
import { ConvActiv } from "../ConvActiv";
import { TabelaKorisnika } from "../AdaptiveCardsInterfaces/TabelaKorisnika";

export class AdaptiveFunctions{

    public  sf: SheetFunctions;

    constructor(){
        this.sf = new SheetFunctions();
    }

    public async kreirajOdgovaranje(){
        return this.sf.kreirajSheetZaOdgovaranje();
    }    
    public async toggleOmoguceno(){
        return this.sf.togglePoslednjeOdgovaranje();
    }
    public async prijaviSeNaOdgovaranje(ca : ConvActiv, user : string, index : string){
        let caString = JSON.stringify(ca);
        let indexNum = Number.parseInt(index);
        return await this.sf.prijavljivanjeNaPoslednjeOdgovaranje(caString, user, indexNum);
    }

    public async karticaRedOdgovaranjaProfesor() {
        let vrednost : TabelaKorisnika = {vrednosti : [], omoguceno : ""};
        let pov = await this.sf.vratiPoslednjeKorisnikeUTabeli();
        pov.korisnici.forEach(v=>{
            vrednost.vrednosti.push(v[0]);
            vrednost.vrednosti.push(v[1]);
            vrednost.vrednosti.push(v[2]);
        });
        vrednost.omoguceno = pov.omoguceno;
        return vrednost;
    }

    public async vratiSvePriavljeneKorisnikeNaPoslednjemOdgovaranju(){
        let vrednosti  = await this.sf.vratiContextSvihNaPoslednjemOdgovaranju();
        let nizContext : ConvActiv[] = vrednosti.map(value=>{
            return JSON.parse(value[0]);
        });
        return nizContext;
    }

}