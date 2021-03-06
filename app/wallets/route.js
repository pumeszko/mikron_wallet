import Route from '@ember/routing/route';
import { get } from '@ember/object';
import { tryInvoke } from '@ember/utils';

import AuthenticatedRouteMixin from 'ember-simple-auth/mixins/authenticated-route-mixin';
import { action } from '@ember-decorators/object';
import { service } from '@ember-decorators/service';

export default class WalletsRoute extends Route.extend(
  AuthenticatedRouteMixin,
) {
  @service intl = null;

  @service session = null;

  @service electron = null;

  @service rpc = null;

  @service flashMessages = null;

  beforeModel(...args) {
    const electron = this.get('electron');
    const isElectron = get(electron, 'isElectron');
    if (isElectron) {
      const isNodeStarted = get(electron, 'isNodeStarted');
      if (!isNodeStarted) {
        return this.transitionTo('start');
      }
    }

    return super.beforeModel(...args);
  }

  setupController(controller, model) {
    const poller = get(controller, 'poller');
    tryInvoke(poller, 'resume');
    return super.setupController(controller, model);
  }

  @action
  async changeRepresentative(model, changeset) {
    const flashMessages = this.get('flashMessages');
    const wallet = get(model, 'id');
    const representative = get(changeset, 'representative');
    try {
      await this.get('rpc').walletRepresentativeSet(wallet, representative);
    } catch (err) {
      const failureMessage = this.get('intl').t('wallets.settings.defaultRepresentativeChangeFailed');
      flashMessages.danger(failureMessage);
      throw err;
    }

    const message = this.get('intl').t('wallets.settings.defaultRepresentativeChanged');
    flashMessages.success(message);
    return this.transitionTo('wallets.overview');
  }

  @action
  async changePassword(model, changeset) {
    const session = this.get('session');
    const wallet = get(model, 'id');
    const password = get(changeset, 'password');
    await this.get('rpc').passwordChange(wallet, password);
    await session.authenticate('authenticator:wallet', { wallet, password });

    const flashMessages = this.get('flashMessages');
    const message = this.get('intl').t('wallets.settings.passwordChanged');
    flashMessages.success(message);
    return this.transitionTo('wallets.overview');
  }
}
