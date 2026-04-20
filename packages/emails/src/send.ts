import { render } from "@react-email/render";
import { type Message, ServerClient } from "postmark";
import type React from "react";
import { env } from "./env";

export const postmark = new ServerClient(env.RESEND_API_KEY);

export interface Emails {
  react: React.JSX.Element;
  subject: string;
  to: string[];
  from: string;
  reply_to?: string;
}

export type EmailHtml = {
  html: string;
  subject: string;
  to: string;
  from: string;
  reply_to?: string;
};

const toPostmarkMessage = (email: EmailHtml): Message => ({
  From: email.from,
  To: email.to,
  Subject: email.subject,
  HtmlBody: email.html,
  ReplyTo: email.reply_to,
});

export const sendEmail = async (email: Emails) => {
  if (process.env.NODE_ENV !== "production") return;
  const html = await render(email.react);
  await postmark.sendEmail({
    From: email.from,
    To: email.to.join(","),
    Subject: email.subject,
    HtmlBody: html,
    ReplyTo: email.reply_to,
  });
};

export const sendBatchEmailHtml = async (emails: EmailHtml[]) => {
  if (process.env.NODE_ENV !== "production") return;
  await postmark.sendEmailBatch(emails.map(toPostmarkMessage));
};

// TODO: delete in favor of sendBatchEmailHtml
export const sendEmailHtml = async (emails: EmailHtml[]) => {
  if (process.env.NODE_ENV !== "production") return;
  await postmark.sendEmailBatch(emails.map(toPostmarkMessage));
};

export const sendWithRender = async (email: Emails) => {
  if (process.env.NODE_ENV !== "production") return;
  const html = await render(email.react);
  await postmark.sendEmail({
    From: email.from,
    To: email.to.join(","),
    Subject: email.subject,
    HtmlBody: html,
    ReplyTo: email.reply_to,
  });
};
