/** @jsxImportSource react */

import { render } from "@react-email/render";
import { Effect, Schedule } from "effect";
import { ServerClient } from "postmark";
import { env } from "./env";
import type { MonitorAlertProps } from "../emails/monitor-alert";
import PageSubscriptionEmail from "../emails/page-subscription";
import type { PageSubscriptionProps } from "../emails/page-subscription";
import StatusPageMagicLinkEmail from "../emails/status-page-magic-link";
import type { StatusPageMagicLinkProps } from "../emails/status-page-magic-link";
import StatusReportEmail from "../emails/status-report";
import type { StatusReportProps } from "../emails/status-report";
import TeamInvitationEmail from "../emails/team-invitation";
import type { TeamInvitationProps } from "../emails/team-invitation";
import { monitorAlertEmail } from "../hotfix/monitor-alert";

// split an array into chunks of a given size.
function chunk<T>(array: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}

export class EmailClient {
  public readonly client: ServerClient;

  constructor(opts: { apiKey: string }) {
    this.client = new ServerClient(opts.apiKey);
  }

  public async sendFollowUp(_req: { to: string }) {
    return;
  }

  public async sendFollowUpBatched(_req: { to: string[] }) {
    return;
  }

  public async sendSlackFeedback(_req: { to: string }) {
    return;
  }

  public async sendSlackFeedbackBatched(_req: { to: string[] }) {
    return;
  }

  public async sendStatusReportUpdate(
    req: Omit<StatusReportProps, "unsubscribeUrl" | "manageUrl"> & {
      subscribers: Array<{ email: string; token: string }>;
      pageSlug: string;
      customDomain?: string | null;
    },
  ) {
    const statusPageBaseUrl = req.customDomain
      ? `https://${req.customDomain}`
      : `https://${req.pageSlug}.openstatus.dev`;

    if (process.env.NODE_ENV === "development") {
      console.log(
        `Sending status report update emails to ${req.subscribers
          .map((s) => s.email)
          .join(", ")}`,
      );
      return;
    }

    for (const recipients of chunk(req.subscribers, 100)) {
      const messages = await Promise.all(
        recipients.map(async (subscriber) => {
          const unsubscribeUrl = `${statusPageBaseUrl}/unsubscribe/${subscriber.token}`;
          const manageUrl = `${statusPageBaseUrl}/manage/${subscriber.token}`;
          const html = await render(
            <StatusReportEmail
              {...req}
              unsubscribeUrl={unsubscribeUrl}
              manageUrl={manageUrl}
            />,
          );
          return {
            From: `${req.pageTitle} <${env.EMAIL_FROM}>`,
            Subject: req.reportTitle,
            To: subscriber.email,
            HtmlBody: html,
          };
        }),
      );

      const sendEmail = Effect.tryPromise({
        try: () => this.client.sendEmailBatch(messages),
        catch: (_unknown) =>
          new Error(
            `Error sending status report update batch to ${recipients.map(
              (r) => r.email,
            )}`,
          ),
      }).pipe(
        Effect.retry({
          times: 3,
          schedule: Schedule.exponential("1000 millis"),
        }),
      );
      await Effect.runPromise(sendEmail).catch(console.error);
    }

    console.log(
      `Sent status report update email to ${req.subscribers.length} subscribers`,
    );
  }

  public async sendTeamInvitation(req: TeamInvitationProps & { to: string }) {
    if (process.env.NODE_ENV === "development") {
      console.log(`Sending team invitation email to ${req.to}`);
      return;
    }

    try {
      const html = await render(<TeamInvitationEmail {...req} />);
      await this.client.sendEmail({
        From: `${
          req.workspaceName ?? "OpenStatus"
        } <${env.EMAIL_FROM}>`,
        Subject: `You've been invited to join ${
          req.workspaceName ?? "OpenStatus"
        }`,
        To: req.to,
        HtmlBody: html,
      });
      console.log(`Sent team invitation email to ${req.to}`);
    } catch (err) {
      console.error(`Error sending team invitation email to ${req.to}`, err);
    }
  }

  public async sendMonitorAlert(req: MonitorAlertProps & { to: string }) {
    if (process.env.NODE_ENV === "development") {
      console.log(`Sending monitor alert email to ${req.to}`);
      return;
    }

    try {
      const html = monitorAlertEmail(req);
      await this.client.sendEmail({
        From: `OpenStatus <${env.EMAIL_FROM}>`,
        Subject: `${req.name}: ${req.type.toUpperCase()}`,
        To: req.to,
        HtmlBody: html,
      });
      console.log(`Sent monitor alert email to ${req.to}`);
    } catch (err) {
      console.error(`Error sending monitor alert to ${req.to}`, err);
      throw err;
    }
  }

  public async sendPageSubscription(
    req: PageSubscriptionProps & { to: string },
  ) {
    if (process.env.NODE_ENV === "development") {
      console.log(`Sending page subscription email to ${req.to}`);
      return;
    }

    try {
      const html = await render(<PageSubscriptionEmail {...req} />);
      await this.client.sendEmail({
        From: `Status Page <${env.EMAIL_FROM}>`,
        Subject: `Confirm your subscription to ${req.page}`,
        To: req.to,
        HtmlBody: html,
      });
      console.log(`Sent page subscription email to ${req.to}`);
    } catch (err) {
      console.error(`Error sending page subscription to ${req.to}`, err);
    }
  }

  public async sendStatusPageMagicLink(
    req: StatusPageMagicLinkProps & { to: string },
  ) {
    if (process.env.NODE_ENV === "development") {
      console.log(`Sending status page magic link email to ${req.to}`);
      console.log(`>>> Magic Link: ${req.link}`);
      return;
    }

    try {
      const html = await render(<StatusPageMagicLinkEmail {...req} />);
      await this.client.sendEmail({
        From: `Status Page <${env.EMAIL_FROM}>`,
        Subject: `Authenticate to ${req.page}`,
        To: req.to,
        HtmlBody: html,
      });
      console.log(`Sent status page magic link email to ${req.to}`);
    } catch (err) {
      console.error(`Error sending status page magic link to ${req.to}`, err);
    }
  }

  public async sendMaintenanceNotification(req: {
    subscribers: Array<{ email: string; token: string }>;
    pageTitle: string;
    pageSlug: string;
    customDomain?: string | null;
    maintenanceTitle: string;
    message: string;
    from: string;
    to: string;
    pageComponents: string[];
  }) {
    const statusPageBaseUrl = req.customDomain
      ? `https://${req.customDomain}`
      : `https://${req.pageSlug}.openstatus.dev`;

    if (process.env.NODE_ENV === "development") {
      console.log(
        `Sending maintenance notification emails to ${req.subscribers
          .map((s) => s.email)
          .join(", ")}`,
      );
      return;
    }

    for (const recipients of chunk(req.subscribers, 100)) {
      const messages = await Promise.all(
        recipients.map(async (subscriber) => {
          const unsubscribeUrl = `${statusPageBaseUrl}/unsubscribe/${subscriber.token}`;
          const manageUrl = `${statusPageBaseUrl}/manage/${subscriber.token}`;
          const html = await render(
            <StatusReportEmail
              pageTitle={req.pageTitle}
              reportTitle={req.maintenanceTitle}
              status="maintenance"
              date={`${req.from} - ${req.to}`}
              message={req.message}
              pageComponents={req.pageComponents}
              unsubscribeUrl={unsubscribeUrl}
              manageUrl={manageUrl}
            />,
          );
          return {
            From: `${req.pageTitle} <${env.EMAIL_FROM}>`,
            Subject: `Scheduled Maintenance: ${req.maintenanceTitle}`,
            To: subscriber.email,
            HtmlBody: html,
          };
        }),
      );

      const sendEmail = Effect.tryPromise({
        try: () => this.client.sendEmailBatch(messages),
        catch: (_unknown) =>
          new Error(
            `Error sending maintenance notification batch to ${recipients.map(
              (r) => r.email,
            )}`,
          ),
      }).pipe(
        Effect.retry({
          times: 3,
          schedule: Schedule.exponential("1000 millis"),
        }),
      );
      await Effect.runPromise(sendEmail).catch(console.error);
    }

    console.log(
      `Sent maintenance notification email to ${req.subscribers.length} subscribers`,
    );
  }
}
