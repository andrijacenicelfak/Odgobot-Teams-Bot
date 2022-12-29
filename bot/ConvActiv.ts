import { Activity, ConversationReference } from "botbuilder";

export interface ConvActiv{
  conv : Partial<ConversationReference>;
  act : Activity;
};