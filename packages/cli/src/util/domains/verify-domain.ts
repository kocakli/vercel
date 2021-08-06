import chalk from 'chalk';
import retry from 'async-retry';
import { Domain } from '../../types';
import * as ERRORS from '../errors-ts';
import Client from '../client';

export default async function verifyDomain(
  client: Client,
  domainName: string,
  contextName: string
) {
  client.output.spinner(
    `Verifying domain ${domainName} under ${chalk.bold(contextName)}`
  );
  try {
    const { domain } = await performVerifyDomain(client, domainName);
    return domain;
  } catch (error) {
    if (error.code === 'verification_failed') {
      return new ERRORS.DomainVerificationFailed({
        purchased: false,
        domain: error.name as string,
        nsVerification: error.nsVerification as ERRORS.NSVerificationError,
        txtVerification: error.txtVerification as ERRORS.TXTVerificationError,
      });
    }
    throw error;
  }
}

type Response = {
  domain: Domain;
};

async function performVerifyDomain(client: Client, domain: string) {
  return retry(
    async () =>
      client.fetch<Response>(
        `/v4/domains/${encodeURIComponent(domain)}/verify`,
        {
          body: {},
          method: 'POST',
        }
      ),
    { retries: 5, maxTimeout: 8000 }
  );
}