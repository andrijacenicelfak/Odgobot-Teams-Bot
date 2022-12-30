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
import rawProfesorPocetna from "./adaptiveCards/profesor_pocetna.json"
import rawStudentPocetna from "./adaptiveCards/student_pocetna.json"
import rawProfesorRed from "./adaptiveCards/profesor_red_odgovaranja.json"
import rawProfesorObavestiSve from "./adaptiveCards/profesor_obavesti_sve.json"
import rawStudentObavestenje from "./adaptiveCards/student_obavestenje.json"
import { AdaptiveCards } from "@microsoft/adaptivecards-tools";
import { getInfoFromTable, prijaviNaPoslednjeOdgovaranje } from "./SheetsFunctions";
import * as adaptivneFunkcije from "./adaptivneFunkcije";
import * as sheetsFunctions from "./SheetsFunctions";
import { TabelaKorisnika } from "./AdaptiveCardsInterfaces/TabelaKorisnika";
import { ObavestenjeStudenta } from "./AdaptiveCardsInterfaces/ObavestenjeStudenta";
import { ConvActiv } from "./ConvActiv";
export class TeamsBot extends TeamsActivityHandler {
  private adaptiveFunctions : AdaptiveFunctions;
  constructor() {
    super();
    
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
          const card = AdaptiveCards.declare<TabelaKorisnika>(rawProfesorPocetna).render();
          await context.sendActivity({ attachments: [CardFactory.adaptiveCard(card)] });
          break;
        }
        case "student":{
          const card = AdaptiveCards.declare<TabelaKorisnika>(rawStudentPocetna).render();
          await context.sendActivity({ attachments: [CardFactory.adaptiveCard(card)] });
          break;
        }
        default:{
          await context.sendActivity("I don't realy understand you!");
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
    if( invokeValue.action.verb ==="prijaviStudent"){
      let brIndeksa : string = (invokeValue.action.data.brojIndeksa == undefined ? "0" : invokeValue.action.data.brojIndeksa).toString();
      let user = context.activity.from.name;

      const convref = TurnContext.getConversationReference(context.activity);
      let ca : ConvActiv= {conv : convref, act : context.activity};

      let uspesno = await this.adaptiveFunctions.prijaviSeNaOdgovaranje(ca, user, brIndeksa);
      await context.sendActivity("Uspesno prijavljen na odgovaranje!"); // TODO kartica sa tabelo

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
      await kontektsi.forEach(async(cr)=>{
        context.adapter.continueConversation(cr.conv, async(contextn : TurnContext)=>{
          await contextn.sendActivity({ attachments: [CardFactory.adaptiveCard(card)] });
        });
      });

      return { statusCode: 200, type: undefined, value: undefined };
    }
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
