"use client";

import { getApexDomain, getSubdomain } from "@/lib/domains";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@openstatus/ui/components/ui/tabs";
import { cn } from "@openstatus/ui/lib/utils";

export const InlineSnippet = ({
  className,
  children,
}: {
  className?: string;
  children?: string;
}) => {
  return (
    <span
      className={cn(
        "inline-block rounded-md bg-muted px-1 py-0.5 font-mono",
        className,
      )}
    >
      {children}
    </span>
  );
};

const CNAME_VALUE =
  process.env.NEXT_PUBLIC_STATUS_PAGE_CNAME || "cname.vercel-dns.com";
const A_RECORD_VALUE = process.env.NEXT_PUBLIC_STATUS_PAGE_A || "76.76.21.21";

export default function DomainConfiguration({ domain }: { domain: string }) {
  const apexName = getApexDomain(`https://${domain}`);
  const subdomain = apexName ? getSubdomain(domain, apexName) : null;

  if (!apexName) return null;

  return (
    <div className="space-y-3">
      <p className="font-semibold text-sm">DNS configuration</p>
      <Tabs defaultValue={subdomain ? "CNAME" : "A"}>
        <TabsList>
          <TabsTrigger value="A">
            A Record{!subdomain && " (recommended)"}
          </TabsTrigger>
          <TabsTrigger value="CNAME">
            CNAME Record{subdomain && " (recommended)"}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="A" className="space-y-2">
          <p className="text-sm">
            To configure your apex domain (
            <InlineSnippet>{apexName}</InlineSnippet>), set the following A
            record on your DNS provider:
          </p>
          <div className="flex items-center justify-start space-x-10 rounded-md bg-muted p-2">
            <div>
              <p className="font-bold text-sm">Type</p>
              <p className="mt-2 font-mono text-sm">A</p>
            </div>
            <div>
              <p className="font-bold text-sm">Name</p>
              <p className="mt-2 font-mono text-sm">@</p>
            </div>
            <div>
              <p className="font-bold text-sm">Value</p>
              <p className="mt-2 font-mono text-sm">{A_RECORD_VALUE}</p>
            </div>
            <div>
              <p className="font-bold text-sm">TTL</p>
              <p className="mt-2 font-mono text-sm">86400</p>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="CNAME">
          <div className="flex items-center justify-start space-x-10 rounded-md bg-muted p-2">
            <div>
              <p className="font-bold text-sm">Type</p>
              <p className="mt-2 font-mono text-sm">CNAME</p>
            </div>
            <div>
              <p className="font-bold text-sm">Name</p>
              <p className="mt-2 font-mono text-sm">{subdomain ?? "www"}</p>
            </div>
            <div>
              <p className="font-bold text-sm">Value</p>
              <p className="mt-2 font-mono text-sm">{CNAME_VALUE}</p>
            </div>
            <div>
              <p className="font-bold text-sm">TTL</p>
              <p className="mt-2 font-mono text-sm">86400</p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
      <p className="mt-3 text-muted-foreground text-sm">
        Note: for TTL, if <InlineSnippet>86400</InlineSnippet> is not available,
        set the highest value possible. Domain propagation can take up to an
        hour.
      </p>
    </div>
  );
}
