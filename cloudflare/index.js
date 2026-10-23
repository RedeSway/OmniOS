import { Container, getContainer } from '@cloudflare/containers';

export class OmniOSContainer extends Container {
  defaultPort = 80;
  sleepAfter = '2m';
}

export default {
  async fetch(request, env) {
    const container = getContainer(env.OMNIOS_CONTAINER, 'omnios');
    return container.fetch(request);
  },
};
