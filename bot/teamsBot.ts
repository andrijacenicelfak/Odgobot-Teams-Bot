import { default as axios } from "axios";
import * as querystring from "querystring";
import { AdaptiveFunctions} from "./classes/AdaptiveFunctions";
import {
  TeamsActivityHandler,
  CardFactory,
  TurnContext,
  AdaptiveCardInvokeValue,
  AdaptiveCardInvokeResponse,
  ConversationReference,
  Activity,
  ChannelInfo,
  TeamInfo,
  MessageFactory,
} from "botbuilder";
import rawProfesorPocetna from "./adaptiveCards/profesor_pocetna.json";
import rawStudentPocetna from "./adaptiveCards/student_pocetna.json";
import rawProfesorRed from "./adaptiveCards/profesor_red_odgovaranja.json";
import rawProfesorObavestiSve from "./adaptiveCards/profesor_obavesti_sve.json";
import rawStudentObavestenje from "./adaptiveCards/student_obavestenje.json";
import rawStudentTabela from "./adaptiveCards/student_tabela.json";
import rawObavestiPoslednjeg from "./adaptiveCards/profesor_obavesti_poslednjeg.json"
import rawProfesorLogin from "./adaptiveCards/profesor_login.json";
import rawProfesorChangePassword from "./AdaptiveCards/profesor_change_password.json";
import rawProfesorChangeTableID from "./adaptiveCards/profesor_postavi_novi_ID.json";
import { AdaptiveCards } from "@microsoft/adaptivecards-tools";
import { TabelaKorisnika } from "./AdaptiveCardsInterfaces/TabelaKorisnika";
import { ObavestenjeStudenta } from "./AdaptiveCardsInterfaces/ObavestenjeStudenta";
import { ConvActiv } from "./ConvActiv";
import { StudentTabela } from "./AdaptiveCardsInterfaces/StudentTabela";


import * as fs from 'fs';

export class TeamsBot extends TeamsActivityHandler {
  private adaptiveFunctions : AdaptiveFunctions;
  private profesorPassword : string;
  constructor() {
    super();

    this.profesorPassword = JSON.parse(fs.readFileSync("C:/home/site/wwwroot/profesor_login.json", 'utf-8')).password;
  
    this.adaptiveFunctions = new AdaptiveFunctions();
    this.onMessage(async (context, next) => {
      console.log("Running with Message Activity.");

      let txt = context.activity.text;
      const removedMentionText = TurnContext.removeRecipientMention(context.activity);

      if (removedMentionText) {
        txt = removedMentionText.toLowerCase().replace(/\n|\r/g, "").trim();
      }

      switch (txt) {
        case "profesor":{
          const card = AdaptiveCards.declare<TabelaKorisnika>(rawProfesorLogin).render();
          await context.sendActivity({ attachments: [CardFactory.adaptiveCard(card)] });
          break;
        }
        case "student":{
          const card = AdaptiveCards.declare<TabelaKorisnika>(rawStudentPocetna).render();
          await context.sendActivity({ attachments: [CardFactory.adaptiveCard(card)] });
          break;
        }
        default:{
          await context.sendActivity("Ne razumem te!");
          break;
        }
      }

      await next();
    });
    
    this.onMembersAdded(async (context, next) => {
      const membersAdded = context.activity.membersAdded;
      for (let cnt = 0; cnt < membersAdded.length; cnt++) {
        if (membersAdded[cnt].id) {
          /*const card = AdaptiveCards.declareWithoutData(rawWelcomeCard).render();
          await context.sendActivity({ attachments: [CardFactory.adaptiveCard(card)] });*/
          await context.sendActivity("Dobro došli");
          break;
        }
      }
      await next();
    });

    this.onTeamsChannelCreated(async (channelInfo: ChannelInfo, teamInfo: TeamInfo, turnContext : TurnContext, next: ()=> Promise<void>): Promise<void> =>{
      await next();
    });

  }
  
  async messageAllMembersAsync(context : TurnContext) {
    //const data = await sheetsFunctions.vratiPodatkeSaPoslednjegOdgovaranja();
    const data = await this.adaptiveFunctions.sf.vratiPodatkeSaPoslednjegOdgovaranja();
    await data.forEach(async row =>{
      let cr : ConvActiv = JSON.parse(row[2]);
      context.adapter.continueConversation(cr.conv, async(contextn : TurnContext)=>{
        await contextn.sendActivity( row[0] + " : " + row[1]);
    });
    });
    await context.sendActivity(MessageFactory.text('All messages have been sent.'));
  }
  async onAdaptiveCardInvoke(
    context: TurnContext,
    invokeValue: AdaptiveCardInvokeValue
  ): Promise<AdaptiveCardInvokeResponse> {
    if(invokeValue.action.verb === "kreairajOdogovaranje"){
        let id = await this.adaptiveFunctions.kreirajOdgovaranje();

        let odg : TabelaKorisnika;
        odg = {
          vrednosti : ["","","","","","","","","","","","","","",""],
          omoguceno : "TRUE"
        };
        const card = AdaptiveCards.declare<TabelaKorisnika>(rawProfesorRed).render(odg);
        await context.updateActivity({
          type: "message",
          id: context.activity.replyToId,
          attachments: [CardFactory.adaptiveCard(card)],
        });
        return { statusCode: 200, type: undefined, value: undefined };
    }

    if(invokeValue.action.verb === "nastaviPoslednjeOdgovaranje"){
        let odg : TabelaKorisnika;

        odg = await this.adaptiveFunctions.karticaRedOdgovaranjaProfesor();

        const card = AdaptiveCards.declare<TabelaKorisnika>(rawProfesorRed).render(odg);
        await context.sendActivity({
          type: "message",
          id: context.activity.replyToId,
          attachments: [CardFactory.adaptiveCard(card)],
        });
        return { statusCode: 200, type: undefined, value: undefined };
    }
    if(invokeValue.action.verb === "osveziTabeluProfesora"){
        let odg : TabelaKorisnika;

        odg = await this.adaptiveFunctions.karticaRedOdgovaranjaProfesor();

        const card = AdaptiveCards.declare<TabelaKorisnika>(rawProfesorRed).render(odg);
        await context.updateActivity({
          type: "message",
          id: context.activity.replyToId,
          attachments: [CardFactory.adaptiveCard(card)],
        });
        return { statusCode: 200, type: undefined, value: undefined };
    }

    if(invokeValue.action.verb === "omoguci"){
      let omoguci = await this.adaptiveFunctions.toggleOmoguceno();

      let vrednost = await this.adaptiveFunctions.karticaRedOdgovaranjaProfesor();

      const card = AdaptiveCards.declare<TabelaKorisnika>(rawProfesorRed).render(vrednost);
      await context.updateActivity({
        type: "message",
        id: context.activity.replyToId,
        attachments: [CardFactory.adaptiveCard(card)],
      });
      return { statusCode: 200, type: undefined, value: undefined };
    }
    if( invokeValue.action.verb ==="zamenaIDTabele"){
        const card = AdaptiveCards.declare<TabelaKorisnika>(rawProfesorChangeTableID).render();
        await context.sendActivity({ attachments: [CardFactory.adaptiveCard(card)] });
      return { statusCode: 200, type: undefined, value: undefined };
    }

    if( invokeValue.action.verb ==="postaviNoviIDTabele"){
        let idOdg : string = (invokeValue.action.data.noviID == undefined ? "0" : invokeValue.action.data.noviID).toString();
        await this.adaptiveFunctions.KreirajNovuTabelu(idOdg);
        const card = AdaptiveCards.declare<TabelaKorisnika>(rawProfesorPocetna).render();
        await context.sendActivity({ attachments: [CardFactory.adaptiveCard(card)] });
        fs.writeFileSync("./id_odgovaranja.json", JSON.stringify({id : idOdg}));
      return { statusCode: 200, type: undefined, value: undefined };
    }

    if( invokeValue.action.verb ==="promeniSifru"){
        const card = AdaptiveCards.declare<TabelaKorisnika>(rawProfesorChangePassword).render();
        await context.sendActivity({ attachments: [CardFactory.adaptiveCard(card)] });
      return { statusCode: 200, type: undefined, value: undefined };
    }
    if( invokeValue.action.verb ==="changePassword"){
        let pass : string = (invokeValue.action.data.password == undefined ? "0" : invokeValue.action.data.password).toString();
        //this.profesorPassword = JSON.parse(fs.readFileSync("./profesor_login.json", 'utf-8')).password;
        this.profesorPassword = pass;
        const card = AdaptiveCards.declare<TabelaKorisnika>(rawProfesorPocetna).render();
        await context.sendActivity({ attachments: [CardFactory.adaptiveCard(card)] });
        fs.writeFileSync("./profesor_login.json", JSON.stringify({password : pass}));
      return { statusCode: 200, type: undefined, value: undefined };
    }
    if( invokeValue.action.verb ==="loginProfesor"){
      let pass : string = (invokeValue.action.data.password == undefined ? "0" : invokeValue.action.data.password).toString();
      if (pass === this.profesorPassword){
        const card = AdaptiveCards.declare<TabelaKorisnika>(rawProfesorPocetna).render();
        await context.sendActivity({ attachments: [CardFactory.adaptiveCard(card)] });
      }else{
        await context.sendActivity("Pogresna sifra! Pokusaj ponovo!");
        const card = AdaptiveCards.declare<TabelaKorisnika>(rawProfesorLogin).render();
        await context.sendActivity({ attachments: [CardFactory.adaptiveCard(card)] });
      }
      return { statusCode: 200, type: undefined, value: undefined };
    }
    if( invokeValue.action.verb ==="prijaviStudent"){
      let brIndeksa : string = (invokeValue.action.data.brojIndeksa == undefined ? "0" : invokeValue.action.data.brojIndeksa).toString();
      let user = context.activity.from.name;

      const convref = TurnContext.getConversationReference(context.activity);
      let ca : ConvActiv= {conv : convref, act : context.activity};

      let uspesno = await this.adaptiveFunctions.prijaviSeNaOdgovaranje(ca, user, brIndeksa);
      if(!uspesno){
        await context.sendActivity("Na žalost nije se moguće prijaviti!");
              return { statusCode: 200, type: undefined, value: undefined };
      }
      let data = await this.adaptiveFunctions.vratiTriSledecaZaOdgovaranje(ca);
      const card = AdaptiveCards.declare<StudentTabela>(rawStudentTabela).render(data);
      await context.sendActivity({
        type: "message",
        id: context.activity.replyToId,
        attachments: [CardFactory.adaptiveCard(card)],
      });
      return { statusCode: 200, type: undefined, value: undefined };
    }

    if(invokeValue.action.verb == "prikaziTabeluStudent"){
      const convref = TurnContext.getConversationReference(context.activity);
      let ca : ConvActiv= {conv : convref, act : context.activity};

      let data = await this.adaptiveFunctions.vratiTriSledecaZaOdgovaranje(ca);
      const card = AdaptiveCards.declare<StudentTabela>(rawStudentTabela).render(data);
      await context.sendActivity({
        type: "message",
        id: context.activity.replyToId,
        attachments: [CardFactory.adaptiveCard(card)],
      });
      return { statusCode: 200, type: undefined, value: undefined };
    }

     if(invokeValue.action.verb == "osveziTabeluStudenata"){
      const convref = TurnContext.getConversationReference(context.activity);
      let ca : ConvActiv= {conv : convref, act : context.activity};
      let data = await this.adaptiveFunctions.vratiTriSledecaZaOdgovaranje(ca);
      const card = AdaptiveCards.declare<StudentTabela>(rawStudentTabela).render(data);
      await context.updateActivity({
        type: "message",
        id: context.activity.replyToId,
        attachments: [CardFactory.adaptiveCard(card)],
      });
      return { statusCode: 200, type: undefined, value: undefined };
    }
    
    if(invokeValue.action.verb === "karticaObavestiSve"){
      const card = AdaptiveCards.declare(rawProfesorObavestiSve).render();
      await context.sendActivity({ attachments: [CardFactory.adaptiveCard(card)] });
      return { statusCode: 200, type: undefined, value: undefined };
    }

    if(invokeValue.action.verb === "obavestiSve"){
      let message : string = (invokeValue.action.data.message == undefined ? "no message" : invokeValue.action.data.message).toString();
      const card = AdaptiveCards.declare<ObavestenjeStudenta>(rawStudentObavestenje).render({message : message});
      let kontektsi = await this.adaptiveFunctions.vratiSvePriavljeneKorisnikeNaPoslednjemOdgovaranju();
      if(kontektsi === null){
        await context.sendActivity("Nema nikog u redu!");
      }else{
        await kontektsi.forEach(async(cr)=>{
          context.adapter.continueConversation(cr.conv, async(contextn : TurnContext)=>{
            await contextn.sendActivity({ attachments: [CardFactory.adaptiveCard(card)] });
          });
        });
      }
      return { statusCode: 200, type: undefined, value: undefined };
    }
    if(invokeValue.action.verb == "zavrsiOdgovaranje"){

      const convref = TurnContext.getConversationReference(context.activity);
      let zavrseno : boolean = await this.adaptiveFunctions.zavrsiOdgovaranje(convref.user.id);
      if(zavrseno)
        await context.sendActivity("Uspesno zavrseno!");
      else
        await context.sendActivity("Neuspesno!");
      return { statusCode: 200, type: undefined, value: undefined };
    }
    if(invokeValue.action.verb === "kariticaObavestiPoslednjeg"){

      const card = AdaptiveCards.declare(rawObavestiPoslednjeg).render();
      await context.sendActivity({ attachments: [CardFactory.adaptiveCard(card)] });
      return { statusCode: 200, type: undefined, value: undefined };
    }
    if(invokeValue.action.verb === "obavesti_poslednjeg"){ 
      let message : string = (invokeValue.action.data.message == undefined ? "no message" : invokeValue.action.data.message).toString();
      let kon = await this.adaptiveFunctions.obavestiPoslednjeg(); 
      if(kon != undefined && kon != null){
        const card = AdaptiveCards.declare<ObavestenjeStudenta>(rawStudentObavestenje).render({message : message});
        context.adapter.continueConversation(kon.conv, async(contextn : TurnContext)=>{
          await contextn.sendActivity({ attachments: [CardFactory.adaptiveCard(card)] });
        });
      }
      else{
        await context.sendActivity("Nijedan student nije promenio svoj status odgovaranja!");
      }

      return { statusCode: 200, type: undefined, value: undefined };
    }
    if(invokeValue.action.verb === "obavestiSledeceg"){
      let message = "Sledeći ste na redu!";
      let kon = await this.adaptiveFunctions.obavestiSledeceg();
      if(kon === null){
        await context.sendActivity("Nema nikog u redu!");
      }else{

        const card = AdaptiveCards.declare<ObavestenjeStudenta>(rawStudentObavestenje).render({message : message});
        context.adapter.continueConversation(kon.conv, async(contextn : TurnContext)=>{
          await contextn.sendActivity({ attachments: [CardFactory.adaptiveCard(card)] });
        });
      }
      return { statusCode: 200, type: undefined, value: undefined };
    }
    if(invokeValue.action.verb === "odjava_studenta"){
      const convref = TurnContext.getConversationReference(context.activity);
      let zavrseno : boolean = await this.adaptiveFunctions.odjavaStudenta(convref.user.id);
      if(zavrseno){
        await context.sendActivity("Uspesno ste se odjavili sa odgovaranja");
      }
      else{
        await context.sendActivity("Niste se uspesno odjavili sa odgovaranja");
      }
      return { statusCode: 200, type: undefined, value: undefined };
    }
      await context.sendActivity("Ne postoji komanda!");
      return { statusCode: 404, type: undefined, value: undefined };

  }

  // Message extension Code
  // Action.
  public async handleTeamsMessagingExtensionSubmitAction(
    context: TurnContext,
    action: any
  ): Promise<any> {
    switch (action.commandId) {
      case "createCard":
        return createCardCommand(context, action);
      case "shareMessage":
        return shareMessageCommand(context, action);
      default:
        throw new Error("NotImplemented");
    }
  }

  // Search.
  public async handleTeamsMessagingExtensionQuery(context: TurnContext, query: any): Promise<any> {
    const searchQuery = query.parameters[0].value;
    const response = await axios.get(
      `http://registry.npmjs.com/-/v1/search?${querystring.stringify({
        text: searchQuery,
        size: 8,
      })}`
    );

    const attachments = [];
    response.data.objects.forEach((obj) => {
      const heroCard = CardFactory.heroCard(obj.package.name);
      const preview = CardFactory.heroCard(obj.package.name);
      preview.content.tap = {
        type: "invoke",
        value: { name: obj.package.name, description: obj.package.description },
      };
      const attachment = { ...heroCard, preview };
      attachments.push(attachment);
    });

    return {
      composeExtension: {
        type: "result",
        attachmentLayout: "list",
        attachments: attachments,
      },
    };
  }

  public async handleTeamsMessagingExtensionSelectItem(
    context: TurnContext,
    obj: any
  ): Promise<any> {
    return {
      composeExtension: {
        type: "result",
        attachmentLayout: "list",
        attachments: [CardFactory.heroCard(obj.name, obj.description)],
      },
    };
  }

  // Link Unfurling.
  public async handleTeamsAppBasedLinkQuery(context: TurnContext, query: any): Promise<any> {
    const attachment = CardFactory.thumbnailCard("Image Preview Card", query.url, [query.url]);

    const result = {
      attachmentLayout: "list",
      type: "result",
      attachments: [attachment],
    };

    const response = {
      composeExtension: result,
    };
    return response;
  }
}

async function createCardCommand(context: TurnContext, action: any): Promise<any> {
  // The user has chosen to create a card by choosing the 'Create Card' context menu command.
  const data = action.data;
  const heroCard = CardFactory.heroCard(data.title, data.text);
  heroCard.content.subtitle = data.subTitle;
  const attachment = {
    contentType: heroCard.contentType,
    content: heroCard.content,
    preview: heroCard,
  };

  return {
    composeExtension: {
      type: "result",
      attachmentLayout: "list",
      attachments: [attachment],
    },
  };
}

async function shareMessageCommand(context: TurnContext, action: any): Promise<any> {
  // The user has chosen to share a message by choosing the 'Share Message' context menu command.
  let userName = "unknown";
  if (
    action.messagePayload &&
    action.messagePayload.from &&
    action.messagePayload.from.user &&
    action.messagePayload.from.user.displayName
  ) {
    userName = action.messagePayload.from.user.displayName;
  }

  // This Message Extension example allows the user to check a box to include an image with the
  // shared message.  This demonstrates sending custom parameters along with the message payload.
  let images = [];
  const includeImage = action.data.includeImage;
  if (includeImage === "true") {
    images = [
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQtB3AwMUeNoq4gUBGe6Ocj8kyh3bXa9ZbV7u1fVKQoyKFHdkqU",
    ];
  }
  const heroCard = CardFactory.heroCard(
    `${userName} originally sent this message:`,
    action.messagePayload.body.content,
    images
  );

  if (
    action.messagePayload &&
    action.messagePayload.attachment &&
    action.messagePayload.attachments.length > 0
  ) {
    // This sample does not add the MessagePayload Attachments.  This is left as an
    // exercise for the user.
    heroCard.content.subtitle = `(${action.messagePayload.attachments.length} Attachments not included)`;
  }

  const attachment = {
    contentType: heroCard.contentType,
    content: heroCard.content,
    preview: heroCard,
  };

  return {
    composeExtension: {
      type: "result",
      attachmentLayout: "list",
      attachments: [attachment],
    },
  };
}
